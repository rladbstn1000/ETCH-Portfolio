#!/usr/bin/env python3
"""사본의 새 합성 환경만 준비/실행한다. 기존 운영·검증 환경을 채택하지 않는다."""
import argparse
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import secrets
import subprocess
import sys
import time
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
STATE = ROOT / '.local/submission-runtime'
ENV = ROOT / '.env'
PROJECT = 'etch-submission'
IMAGES = {
    'ETCH_MYSQL_IMAGE': 'sha256:ccbf152841ff331161b37aeb0f77a015e114245038c724a5a252482fd902c07f',
    'ETCH_REDIS_IMAGE': 'sha256:858f009f9709ce576febc734aa78b8f6d624b82571f9ddb6bda4377c833b3499',
    'ETCH_ES_IMAGE': 'sha256:24c66d1ebb69726bb0593c6073123265a7e0be473ab4eff5af5d027bbbc81a40',
    'ETCH_LOGSTASH_IMAGE': 'sha256:fee4566709e0e936b8c64aa25cddadd62135af1b05c642a519acfce5eb7d794e',
    # Existing dependency image supplies Java 17 only; app comes from this candidate's new JAR.
    'ETCH_SUBMISSION_JAVA_IMAGE': 'sha256:7be9e75385877e513e1150a37c5b9bb33115d0b4b5681e300c88648ebc859a63',
}
DEPENDENCIES = ROOT / '.local/submission-runtime-dependencies.json'
if DEPENDENCIES.exists():
    selected = json.loads(DEPENDENCIES.read_text())['images']
    if set(selected) != set(IMAGES) or any(not value.startswith('sha256:') or len(value) != 71 or any(c not in '0123456789abcdef' for c in value[7:]) for value in selected.values()):
        raise ValueError('Invalid dependency image selection')
    IMAGES = selected
SERVICES = ['mysql', 'redis', 'elasticsearch', 'backend']

def command(args, input=None):
    env = {k: v for k, v in os.environ.items() if not k.startswith(('COMPOSE_', 'ETCH_', 'MYSQL_', 'SPRING_'))}
    result = subprocess.run(args, cwd=ROOT, input=input, text=True, capture_output=True, env=env)
    if result.returncode:
        raise RuntimeError('Submission command failed; raw output suppressed: ' + args[0])
    return result.stdout

def docker(*args, **kwargs): return command(['docker', *args], **kwargs)
def compose(*args, **kwargs):
    guard()
    return docker('compose', '--env-file', str(ENV), '-p', PROJECT, '-f', str(ROOT/'compose.local.yml'),
                  '-f', str(ROOT/'compose.submission.yml'), *args, **kwargs)

def load(name, file):
    spec = importlib.util.spec_from_file_location(name, ROOT/file)
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module

def guard():
    if not (STATE/'identity.json').is_file(): raise ValueError('Run init first; existing resources are never adopted.')
    state = json.loads((STATE/'identity.json').read_text())
    if state['project'] != PROJECT or state['root'] != str(ROOT) or not ENV.is_file() or ENV.is_symlink():
        raise ValueError('Candidate identity/path mismatch')
    if hashlib.sha256(ENV.read_bytes()).hexdigest() != state['envSha256']:
        raise ValueError('Generated environment changed; review explicitly instead of selecting another DB.')

def dependencies():
    if STATE.exists() or ENV.exists() or DEPENDENCIES.exists():
        raise ValueError('Existing candidate dependency/environment state is preserved; do not rebuild it in place.')
    DEPENDENCIES.parent.mkdir(parents=True, exist_ok=True)
    selected = dict(IMAGES)
    for key, file in [('ETCH_MYSQL_IMAGE','local/Dockerfile.mysql'), ('ETCH_ES_IMAGE','local/elasticsearch/Dockerfile'), ('ETCH_LOGSTASH_IMAGE','local/logstash/Dockerfile')]:
        iid = DEPENDENCIES.parent / (key.lower() + '.image-id')
        docker('build', '--iidfile', str(iid), '-f', str(ROOT/file), str(ROOT))
        selected[key] = iid.read_text().strip()
    for key, reference in [('ETCH_REDIS_IMAGE','redis:7.4-alpine'), ('ETCH_SUBMISSION_JAVA_IMAGE','gradle:8.14.4-jdk17-noble@sha256:7be9e75385877e513e1150a37c5b9bb33115d0b4b5681e300c88648ebc859a63')]:
        docker('pull', reference)
        selected[key] = docker('image','inspect', reference, '--format','{{.Id}}').strip()
    DEPENDENCIES.write_text(json.dumps({'images': selected, 'source': 'Included pinned Dockerfiles and upstream images; no original checkout/cache/DB dependency', 'inheritsHistoricalSearchApproval': False}, indent=2)+'\n')
    print('Submission dependency images prepared; new image hashes do not inherit historical acceptance.')


def init():
    if STATE.exists() or ENV.exists():
        guard()
        print('Candidate environment retained.')
        return
    for kind, prefix in [('container','name='),('volume','name='),('network','name=')]:
        names = docker(kind, 'ls', '-a', '--filter', prefix+PROJECT, '--format', '{{.Name}}' if kind != 'container' else '{{.Names}}') if kind=='container' else docker(kind,'ls','--filter',prefix+PROJECT,'--format','{{.Name}}')
        # The separate new list fixture project is allowed; exact main project resources are not.
        if any(n == PROJECT+'_default' or n.startswith(PROJECT+'_') or n.startswith(PROJECT+'-mysql-')
               or n.startswith(PROJECT+'-backend-') or n.startswith(PROJECT+'-elasticsearch-')
               or n.startswith(PROJECT+'-redis-') or n.startswith(PROJECT+'-logstash-') for n in names.splitlines()):
            raise ValueError('Submission resource collision: '+kind)
    for identity in IMAGES.values():
        if docker('image','inspect',identity,'--format','{{.Id}}').strip()!=identity:
            raise ValueError('Dependency image identity changed')
    STATE.mkdir(parents=True,mode=0o700)
    text=(ROOT/'.env.example').read_text()
    for key in ('MYSQL_ROOT_PASSWORD','MYSQL_PASSWORD','SPRING_JWT_SECRET'):
        text=text.replace(key+'=\n',key+'='+secrets.token_hex(32)+'\n')
    text+='\n'+'\n'.join(k+'='+v for k,v in IMAGES.items())+'\n'
    text+='ETCH_COMPOSE_OVERRIDE=compose.submission.yml\n'
    ENV.write_text(text);ENV.chmod(0o600)
    (STATE/'identity.json').write_text(json.dumps({'project':PROJECT,'root':str(ROOT),'envSha256':hashlib.sha256(ENV.read_bytes()).hexdigest(),'dependencyImages':IMAGES,'appSource':'candidate newly built JAR; no old backend image or source mount'},indent=2)+'\n')
    print('New candidate-only credentials generated; values omitted.')

def seed():
    guard()
    os.environ['ETCH_ENV_FILE']=str(ENV)
    runtime=load('runtime','local/runtime.py')
    if runtime.PROJECT!=PROJECT or runtime.ENV_FILE!=ENV:raise ValueError('Wrong candidate target')
    prep=load('submission_prepare','local/evaluation/prepare.py')
    # Same frozen checks, with only the already-reviewed Jackson package move normalized.
    def verify():
        manifest=json.loads((ROOT/'local/evaluation/manifest.json').read_text())
        for name, expected in manifest['dataHashes'].items():
            if hashlib.sha256((ROOT/'local/evaluation'/name).read_bytes()).hexdigest()!=expected:raise ValueError('Frozen data changed')
        for name,expected in manifest['baselineFileHashes'].items():
            raw=(ROOT/name).read_bytes()
            if name.endswith('/ProjectIndexWriter.java'):raw=raw.replace(b'import tools.jackson.databind.ObjectMapper;',b'import com.fasterxml.jackson.databind.ObjectMapper;',1)
            if hashlib.sha256(raw).hexdigest()!=expected:raise ValueError('Frozen search source changed: '+name)
        return manifest
    def isolated_guard():
        guard()
        if runtime.PROJECT!=PROJECT or runtime.ENV_FILE!=ENV:raise ValueError('Seed only the new candidate environment')
    prep.guard=isolated_guard
    prep.verify_freeze=verify
    result=prep.seed()
    (STATE/'seed.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    sync=load('submission_sync','local/search-sync.py');sync.ensure_indices()
    print(json.dumps(result,ensure_ascii=False))

def wait_http(url, predicate, description):
    for _ in range(90):
        try:
            with urllib.request.urlopen(url, timeout=3) as response:
                if response.status == 200 and predicate(json.load(response)):
                    return
        except (OSError, ValueError, urllib.error.URLError):
            pass
        time.sleep(1)
    raise RuntimeError('Candidate readiness timeout: '+description)


def up():
    jar=ROOT/'etch/backend/business-server/build/project-list-mysql/libs/etch-0.0.1-SNAPSHOT.jar'
    if not jar.is_file():raise ValueError('Build candidate JAR with project-list-mysql.py test --stage improved --build first')
    print(compose('up','-d','--no-build','--pull','never',*SERVICES).strip())
    wait_http('http://127.0.0.1:19476/', lambda body: body.get('version',{}).get('number') == '9.4.7', 'Elasticsearch 9.4.7')
    wait_http('http://127.0.0.1:18476/actuator/health', lambda body: body.get('status') == 'UP', 'backend health')
    print('Candidate backend and Elasticsearch ready.')

def sync():
    print(compose('--profile','sync','up','-d','--no-build','--pull','never','logstash').strip())
    for kind in ('job','news'):
        wait_http('http://127.0.0.1:19476/'+kind+'-v3/_count', lambda body: body.get('count',0) >= 24, kind+' fixed corpus delivery')
    print('Both synthetic input indices have completed initial delivery.')
def down():
    print(compose('--profile','sync','down','--timeout','30').strip())
    print('Only candidate containers/network removed; volumes, checkpoint/PQ/DLQ retained.')

def status(): print(compose('--profile','sync','ps').strip())
if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('action',choices=['dependencies','init','up','seed','sync','status','down'])
    try:globals()[p.parse_args().action]()
    except (RuntimeError,ValueError,OSError) as e:print(str(e),file=sys.stderr);raise SystemExit(1)
