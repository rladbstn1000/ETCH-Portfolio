#!/bin/sh
# 기존 ETCH 로컬 DB의 데이터/볼륨을 보존하는 추가 스키마 적용.
set -eu
cd "$(dirname "$0")/.."
./scripts/local-compose.sh exec -T mysql sh -c 'MYSQL_PWD="$MYSQL_PASSWORD" mysql --default-character-set=utf8mb4 -u "$MYSQL_USER" "$MYSQL_DATABASE"' < local/mysql/002-project-indexing.sql
