#!/bin/sh
# 기존 기본값을 유지하며 환경 파일·project 선택을 모든 helper와 일치시킨다.
set -eu
cd "$(dirname "$0")/.."
exec python3 local/runtime.py compose "$@"
