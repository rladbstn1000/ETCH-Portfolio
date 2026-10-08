#!/bin/sh
# 수집기와 ETCH Logstash를 중지한 상태에서 실행한다. MySQL은 실행 중이어야 한다.
# 기존 데이터/볼륨 보존: 추가 DDL 및 ledger 최초 적재만 수행한다.
# 로컬 MySQL의 binary logging 설정에서는 trigger 생성에 root 권한이 필요하다.
# 기존 컨테이너 MYSQL_ROOT_PASSWORD만 사용하며 전역 log_bin_trust 설정은 바꾸지 않는다.
set -eu
cd "$(dirname "$0")/.."
./scripts/local-compose.sh exec -T mysql sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql --default-character-set=utf8mb4 -uroot "$MYSQL_DATABASE"' < local/mysql/003-job-news-sync.sql
