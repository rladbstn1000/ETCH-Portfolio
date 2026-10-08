#!/usr/bin/env python3
"""Compose와 로컬 운영 도구가 공유하는 환경 선택. 환경 값/비밀값을 출력하지 않는다."""
import os
from pathlib import Path
import re
import shlex
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
ENV_FILE = Path(os.environ.get('ETCH_ENV_FILE', '.env'))
if not ENV_FILE.is_absolute():
    ENV_FILE = ROOT / ENV_FILE


def settings():
    values = {}
    if not ENV_FILE.exists() and 'ETCH_ENV_FILE' in os.environ:
        raise ValueError('선택한 환경 파일이 없습니다. scripts/local-init.sh를 먼저 실행하세요.')
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text().splitlines():
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            key, separator, value = line.partition('=')
            if not separator or not re.fullmatch(r'[A-Za-z_][A-Za-z0-9_]*', key):
                raise ValueError('환경 파일 형식 오류')
            parts = shlex.split(value, comments=True)
            values[key] = ' '.join(parts)
    values.update(os.environ)
    return values


VALUES = settings()
PROJECT = VALUES.get('ETCH_COMPOSE_PROJECT', 'etch-submission')
if not re.fullmatch(r'[a-z0-9][a-z0-9_-]*', PROJECT):
    raise ValueError('잘못된 Compose project 이름')
STATE_DIR = Path(VALUES.get('ETCH_STATE_DIR', '.local'))
if not STATE_DIR.is_absolute():
    STATE_DIR = ROOT / STATE_DIR


def url(key, default):
    port = int(VALUES.get(key, default))
    if not 1 <= port <= 65535:
        raise ValueError('잘못된 로컬 포트')
    return f'http://localhost:{port}'


ES_URL = url('ES_PORT', 19476)
API_URL = url('BACKEND_PORT', 18476)
FRONTEND_URL = url('FRONTEND_PORT', 5178)
LOGSTASH_URL = url('LOGSTASH_API_PORT', 19676)


def compose(*args):
    command = ['docker', 'compose', '--env-file', str(ENV_FILE), '-p', PROJECT,
               '-f', str(ROOT / 'compose.local.yml')]
    override = VALUES.get('ETCH_COMPOSE_OVERRIDE')
    if override:
        path = Path(override)
        if not path.is_absolute():
            path = ROOT / path
        if not path.is_file():
            raise ValueError('선택한 Compose override 파일이 없습니다.')
        command += ['-f', str(path)]
    return command + list(args)


if __name__ == '__main__':
    if len(sys.argv) < 2 or sys.argv[1] != 'compose':
        raise SystemExit('Use scripts/local-compose.sh <compose arguments>')
    raise SystemExit(subprocess.call(compose(*sys.argv[2:]), cwd=ROOT))
