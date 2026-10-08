#!/usr/bin/env python3
"""선택 Logstash가 SQL 변경을 실제로 가져오는지 검증. 합성9001만 변경/복원."""
import importlib.util
import json
from pathlib import Path
import time
import urllib.request

root = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('index_seed', root / 'local/index-seed.py')
indexer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(indexer)
es = 'http://localhost:19476'


def await_titles(job, news):
    for _ in range(30):
        j = indexer.request(es, 'GET', '/job/_doc/9001')['_source']
        n = indexer.request(es, 'GET', '/news/_doc/9001')['_source']
        if j['title'] == job and n['title'] == news:
            assert j['jobId'] == 9001 and n['newsId'] == 9001
            assert j['regions'] == ['서울', '경기']
            assert j['jobCategories'] == ['백엔드', 'DevOps/클라우드']
            return
        time.sleep(3)
    raise AssertionError('Logstash schedule 내 title 동기화 미확인')


def main():
    original_job = indexer.mysql_json("SELECT JSON_OBJECT('title',title) FROM job WHERE id=9001;")[0]['title']
    original_news = indexer.mysql_json("SELECT JSON_OBJECT('title',title) FROM news WHERE id=9001;")[0]['title']
    try:
        indexer.mysql_json("UPDATE job SET title='합성 Logstash 반영 공고',updated_at=CURRENT_TIMESTAMP(6) WHERE id=9001; UPDATE news SET title='합성 Logstash 반영 뉴스' WHERE id=9001;")
        print('WAIT 실제 Logstash 매분 SELECT (색인 스크립트 호출 없음)', flush=True)
        await_titles('합성 Logstash 반영 공고', '합성 Logstash 반영 뉴스')
        print('PASS jobs/news 독립 pipeline SQL 변경 → ES 자동 반영; camelCase ID·다중 필드 유지', flush=True)
        assert indexer.request(es, 'GET', '/job/_count')['count'] == 2
        assert indexer.request(es, 'GET', '/news/_count')['count'] == 2
        for path in ('jobs', 'news'):
            with urllib.request.urlopen(f'http://localhost:18476/{path}/search?keyword=Logstash', timeout=15) as response:
                body = json.load(response)
                assert response.status == 200 and len(body['data']['content']) == 1
        print('PASS Logstash가 쓴 날짜/필드로 실제 검색 API 200; job2/news2 유지', flush=True)
    finally:
        job = original_job.replace("'", "''")
        news = original_news.replace("'", "''")
        indexer.mysql_json(f"UPDATE job SET title='{job}',updated_at=CURRENT_TIMESTAMP(6) WHERE id=9001; UPDATE news SET title='{news}' WHERE id=9001;")
        await_titles(original_job, original_news)
        print('PASS 다음 전체 스캔에서 합성 원본 복원 확인; document ID 멱등 갱신', flush=True)


if __name__ == "__main__":
    raise SystemExit("1차 전체 SELECT 검사는 과거 커밋용입니다. python3 local/verify-incremental-sync.py를 사용하세요.")
