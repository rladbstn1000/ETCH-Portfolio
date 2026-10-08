#!/usr/bin/env python3
"""공개 데모 전용: 다른 checkout/project로 자동 대체하지 않는 내부 운영 도구."""
import io,json,os,shlex,subprocess,sys,urllib.error
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
PHASE='phase7'
START_COMMIT='22109569f45055d09b0b0b8c642257eba52bd759'
TARGET=os.environ.get('ETCH_RC_TARGET','fresh')
if TARGET not in ('fresh','migration'):raise ValueError('ETCH_RC_TARGET는 fresh 또는 migration만 허용합니다.')
PROJECT='etch-phase7-'+TARGET+('-v4' if TARGET=='fresh' else '')
STATE_DIR=ROOT/('.local/phase7-'+TARGET+('-v4' if TARGET=='fresh' else ''))
ENV_FILE=STATE_DIR/'release.env'
EVIDENCE_DIR=ROOT/'docs/portfolio/evidence/phase7'
VERIFY_SCHEMA='phase7_verify'
RESOURCES=ROOT/'etch/backend/business-server/src/main/resources/es'
if not ENV_FILE.exists():raise ValueError('python3 deploy/rc/init.py를 먼저 실행하세요.')
VALUES={}
for line in ENV_FILE.read_text().splitlines():
    line=line.strip()
    if not line or line.startswith('#'):continue
    key,_,value=line.partition('='); VALUES[key]=' '.join(shlex.split(value))
API_URL='http://localhost:'+VALUES.get('DEMO_HTTP_PORT','5187')+'/api/v1'
ES_URL='http://elasticsearch:9200'
LOGSTASH_URL='http://logstash:9600'
VERIFY_ES_URL='http://verify-elasticsearch:9200'
VERIFY_API_URL='http://verify-backend:8080/api/v1'
VERIFY_LOGSTASH_URL='http://verify-logstash:9600'
runtime=sys.modules[__name__]
def compose(*args):
    reserved=['--project-name','--project-directory','--file','--env-file']
    commands={'build','config','create','down','events','exec','images','kill','logs','ls','pause','port','ps','pull','push','restart','rm','run','start','stop','top','unpause','up','version','wait'}
    command=None
    for arg in args:
        if command is None and arg in commands:command=arg
        if arg.startswith('-p') or (command not in {'exec','run','logs'} and arg.startswith('-f')) or any(arg==key or arg.startswith(key+'=') for key in reserved):
            raise ValueError('검증 도구의 project/compose/env 파일 선택은 변경할 수 없습니다.')
    return ['docker','compose','--env-file',str(ENV_FILE),'-p',PROJECT,'-f',str(ROOT/'deploy/rc/compose.yml'),*args]
def verify_compose(*args):
    return compose('--profile','verify',*args)
def mysql_json(sql, schema=None):
    if schema not in [None, 'etch_local', VERIFY_SCHEMA]:raise ValueError('검증 schema allowlist 밖입니다.')
    database=schema or 'etch_local'
    r=subprocess.run(compose('exec','-T','mysql','sh','-c','MYSQL_PWD="$MYSQL_PASSWORD" mysql --default-character-set=utf8mb4 -u"$MYSQL_USER" '+database+' --batch --skip-column-names --raw'),input=sql,text=True,capture_output=True,check=True)
    return [json.loads(line) for line in r.stdout.splitlines() if line.strip()]
def request(base,method,path,data=None):
    # 내부 관리 API는 host port를 열지 않고 해당 서비스 안에서 요청한다.
    services={ES_URL:('elasticsearch','9200'),LOGSTASH_URL:('logstash','9600'),VERIFY_ES_URL:('verify-elasticsearch','9200'),VERIFY_LOGSTASH_URL:('verify-logstash','9600')}
    if base not in services:raise ValueError('내부 전용 ES/Logstash 주소만 허용')
    svc,port=services[base]
    inner='http://localhost:'+port+path
    args=compose('exec','-T',svc,'curl','--silent','--show-error','--max-time','30','-X',method,'-H','Content-Type: application/json','-w','\n%{http_code}',inner)
    if data is not None:args+=['--data-binary','@-']
    r=subprocess.run(args,input=None if data is None else json.dumps(data,ensure_ascii=False),capture_output=True,text=True,check=True)
    body,_,status=r.stdout.rpartition('\n')
    if int(status)>=400:raise urllib.error.HTTPError(base+path,int(status),'Internal HTTP error',{},io.BytesIO(body.encode()))
    return json.loads(body) if body.strip() else None
if __name__=='__main__':raise SystemExit(subprocess.call(compose(*sys.argv[1:]),cwd=ROOT))
