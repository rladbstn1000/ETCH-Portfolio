#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
./scripts/local-compose.sh exec -T mysql sh -c 'MYSQL_PWD="$MYSQL_PASSWORD" mysql --default-character-set=utf8mb4 -u "$MYSQL_USER" "$MYSQL_DATABASE"' < local/seed.sql
printf '%s\n' '합성 DB 데이터와 프로젝트 outbox를 함께 커밋했습니다.'
if ! python3 local/index-seed.py; then
  printf '%s\n' '채용·뉴스 매핑 준비 실패. DB 변경 추적과 프로젝트 outbox는 보존됩니다.' >&2
  printf '%s\n' 'ES 복구 후 python3 local/search-sync.py init 및 Logstash 실행으로 전달을 이어갈 수 있습니다.' >&2
  exit 1
fi
