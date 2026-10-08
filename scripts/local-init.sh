#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
python3 - <<'PY'
from pathlib import Path
import secrets
import os
p=Path(os.environ.get('ETCH_ENV_FILE', '.env'))
if p.exists():
    print('Selected environment file exists; preserved')
else:
    s=Path('.env.example').read_text()
    for key in ['MYSQL_ROOT_PASSWORD','MYSQL_PASSWORD','SPRING_JWT_SECRET']:
        s=s.replace(key+'=\n', key+'='+secrets.token_hex(32)+'\n')
    for key in ['ETCH_COMPOSE_PROJECT','ETCH_COMPOSE_OVERRIDE','ETCH_STATE_DIR','MYSQL_PORT','REDIS_PORT','ES_PORT','BACKEND_PORT','FRONTEND_PORT','LOGSTASH_API_PORT','PREVIEW_PORT','VITE_DEMO_MODE']:
        if key in os.environ:
            lines=s.splitlines()
            s='\n'.join(key+'='+os.environ[key] if line.startswith(key+'=') else line for line in lines)+'\n'
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(s)
    p.chmod(0o600)
    print('Created local-only environment file (values not displayed)')
PY
