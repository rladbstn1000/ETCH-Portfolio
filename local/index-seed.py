#!/usr/bin/env python3
"""로컬 공통 DB/ES 도구와 초기 매핑 준비. 문서 직접 색인은 제공하지 않는다."""
import argparse
import importlib.util
import json
from pathlib import Path
import subprocess
import urllib.error
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
_runtime_spec = importlib.util.spec_from_file_location('etch_runtime', ROOT / 'local/runtime.py')
runtime = importlib.util.module_from_spec(_runtime_spec)
_runtime_spec.loader.exec_module(runtime)
RESOURCES = ROOT / "etch/backend/business-server/src/main/resources/es"


def compose(*args):
    return runtime.compose(*args)


def mysql_json(sql):
    # 자격증명은 컨테이너의 환경변수에서 읽고 명령행/출력에 노출하지 않는다.
    result = subprocess.run(compose("exec", "-T", "mysql", "sh", "-c",
        'MYSQL_PWD="$MYSQL_PASSWORD" mysql --default-character-set=utf8mb4 -u"$MYSQL_USER" "$MYSQL_DATABASE" --batch --skip-column-names --raw'),
        input=sql, text=True, check=True, capture_output=True)
    return [json.loads(line) for line in result.stdout.splitlines() if line.strip()]


def request(base, method, path, data=None):
    payload = None if data is None else json.dumps(data, ensure_ascii=False).encode()
    req = urllib.request.Request(base + path, data=payload, method=method,
                                 headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as response:
        return json.load(response)


def index_seed(base):
    # 3차부터 모든 채용/뉴스 쓰기는 Logstash + external revision 규칙을 따른다.
    # seed.sql의 원본 변경 trigger가 이미 같은 트랜잭션에 추적 상태를 기록한다.
    if base != runtime.ES_URL:
        raise ValueError("ES_PORT를 선택한 ETCH_ENV_FILE에 설정하여 DB와 ES 환경을 함께 선택하세요.")
    import importlib.util
    spec = importlib.util.spec_from_file_location("search_sync", ROOT / "local/search-sync.py")
    sync = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(sync)
    sync.ensure_indices()
    print("초기 문서는 Logstash가 전달합니다. --profile sync로 실행하고 search-sync.py compare로 확인하세요.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--es-url", default=runtime.ES_URL)
    index_seed(parser.parse_args().es_url.rstrip("/"))
