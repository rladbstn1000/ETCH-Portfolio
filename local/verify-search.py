#!/usr/bin/env python3
"""합성 DB와 실제 Elasticsearch/API로 검색·재처리 기준선을 검증한다."""
import argparse
import ast
import importlib.util
import json
from pathlib import Path
import re
import subprocess
import urllib.error
import urllib.parse
import urllib.request
import uuid

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("index_seed", ROOT / "local/index-seed.py")
indexer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(indexer)


def check(condition, label):
    if not condition:
        raise AssertionError(label)
    print("PASS", label)


def fetch(url):
    with urllib.request.urlopen(url, timeout=15) as response:
        return json.load(response)


def search(api, path, **params):
    return fetch(api + path + "?" + urllib.parse.urlencode(params))["data"]


def before_fix(es):
    """격리된 임시 인덱스에서 기존 mapping/쿼리의 실패를 실제 ES로 재현."""
    index = "etch-baseline-" + uuid.uuid4().hex[:12]
    original = json.loads(subprocess.check_output(["git", "show",
        "b6feee5a3b0e29ed47cf82d96f51426d05e90fb5:etch/backend/business-server/src/main/resources/es/job-mappings.json"],
        cwd=ROOT, text=True))
    settings = json.loads((indexer.RESOURCES / "job-settings.json").read_text())
    indexer.request(es, "PUT", f"/{index}", {"settings": settings, "mappings": original})
    try:
        indexer.request(es, "PUT", f"/{index}/_doc/1?refresh=true", {
            "jobId": 1, "title": '합성 "백엔드" 개발자', "regions": ["서울"],
            "jobCategories": ["DevOps/클라우드"]})
        old_filter = indexer.request(es, "POST", f"/{index}/_search", {
            "query": {"terms": {"jobCategories": ["DevOps/클라우드"]}}})
        check(old_filter["hits"]["total"]["value"] == 0,
              "수정 전 Nori text + terms: DevOps/클라우드 문서 누락 재현 (0건)")
        malformed = '{"query":{"multi_match":{"query":"%s","fields":["title"]}}}' % '"백엔드"'
        req = urllib.request.Request(es + f"/{index}/_search", data=malformed.encode(),
                                     headers={"Content-Type": "application/json"})
        try:
            urllib.request.urlopen(req, timeout=15)
            raise AssertionError("기존 문자열 쿼리가 예상과 달리 성공")
        except urllib.error.HTTPError as exc:
            check(exc.code == 400, "수정 전 따옴표 문자열 조립: 실제 ES HTTP 400 재현")
    finally:
        indexer.request(es, "DELETE", f"/{index}")


def collector_upsert(title, deadline):
    # 외부 수집/API 키 없이 실제 수집기의 INSERT/UPDATE SQL을 꺼내 로컬 DB에 실행한다.
    tree = ast.parse((ROOT / "etch/backend/batch-server/fetch_job.py").read_text())
    func = next(n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == "save_cleaned_jobs")
    assignment = next(n for n in func.body if isinstance(n, ast.Assign)
                      and any(isinstance(t, ast.Name) and t.id == "insert_sql" for t in n.targets))
    statement = ast.literal_eval(assignment.value)
    params = dict(title=title, company_id=9001, company_name="합성테크 서울", region="서울,경기",
                  industry="IT,웹,통신", job_category="백엔드,DevOps/클라우드", work_type="정규직",
                  education_level="학력무관", opening_date="2026-09-01 09:00:00",
                  expiration_date=deadline, external_job_id="local-job-9001")
    def literal(match):
        value = params[match.group(1)]
        return str(value) if isinstance(value, int) else "'" + value.replace("\\", "\\\\").replace("'", "''") + "'"
    indexer.mysql_json(re.sub(r"%\(([^)]+)\)s", literal, statement))



def verify(api, es):
    for url in (api, es):
        check(urllib.parse.urlparse(url).hostname in {"localhost", "127.0.0.1", "::1"}, "접속 주소가 로컬")
    before_fix(es)
    indexer.index_seed(es)
    jobs = search(api, "/jobs/search", keyword="합성", size=100)
    check({row["id"] for row in jobs["content"]} == {9001, 9002}, "서로 다른 공고 두 건 실제 검색 API")
    filtered = search(api, "/jobs/search", regions="서울", jobCategories="DevOps/클라우드")
    check([row["id"] for row in filtered["content"]] == [9001], "지역·직무 exact 필터")
    for path in ("/jobs/search", "/news/search", "/projects/search", "/search"):
        search(api, path, keyword='"합성"\\\n')
        print("PASS", "따옴표·역슬래시·개행 검색 HTTP 200", path)
    first = search(api, "/jobs/search", keyword="백엔드")
    second = search(api, "/jobs/search", keyword="프론트엔드")
    check({r["id"] for r in first["content"]} == {9001} and
          {r["id"] for r in second["content"]} == {9002}, "검색어 변경 시 API 결과 구분 (UI는 별도 검증)")

    before = indexer.mysql_json("SELECT JSON_OBJECT('count',COUNT(*)) FROM job WHERE external_job_id='local-job-9001';")[0]
    collector_upsert('합성 "백엔드" 개발자 모집', "2099-10-31 23:59:59")
    indexer.index_seed(es)
    after = indexer.mysql_json("SELECT JSON_OBJECT('count',COUNT(*)) FROM job WHERE external_job_id='local-job-9001';")[0]
    check(before == after == {"count": 1}, "실제 수집기 SQL 동일 외부 공고 ID 재처리: DB 1건 유지")
    check(indexer.request(es, "GET", "/job/_count")["count"] == 2, "문서 ID 재처리: ES 2건 유지")
    timestamp_before = indexer.mysql_json("SELECT JSON_OBJECT('updatedAt',updated_at) FROM job WHERE id=9001;")[0]
    try:
        collector_upsert('합성 백엔드 수정완료', "2099-12-31 23:59:59")
        indexer.index_seed(es)
        updated = search(api, "/jobs/search", keyword="수정완료")["content"]
        check(len(updated) == 1 and updated[0]["id"] == 9001 and
              updated[0]["expirationDate"].startswith("2099-12-31"), "실제 수집기 SQL 제목·마감일 수정 → 실제 API 반영")
        timestamp_after = indexer.mysql_json("SELECT JSON_OBJECT('updatedAt',updated_at) FROM job WHERE id=9001;")[0]
        check(timestamp_before != timestamp_after, "같은 날 updated_at 시각 변경")
    finally:
        collector_upsert('합성 "백엔드" 개발자 모집', "2099-10-31 23:59:59")
        indexer.index_seed(es)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--api-url", default="http://localhost:18476")
    parser.add_argument("--es-url", default="http://localhost:19476")
    parser.add_argument("--outage", action="store_true", help="폐기된 1차 장애 검사 옵션 (2차 스크립트로 안내)")
    args = parser.parse_args()
    if args.outage:
        parser.error("1차 수동 복구 검사는 폐기되었습니다. python3 local/verify-project-recovery.py를 사용하세요. 기존 데이터를 초기화하지 않습니다.")
    parser.error("1차 전체/직접 색인 검사는 과거 커밋용입니다. 현재 검증은 local/verify-incremental-sync.py를 사용하세요.")
