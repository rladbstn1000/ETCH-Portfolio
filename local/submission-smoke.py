#!/usr/bin/env python3
"""사본 전용 새 프로젝트의 실제 HTTP/MySQL/ES 자동 복구 확인. 토큰과 값은 출력하지 않는다."""
import base64
import hashlib
import hmac
import importlib.util
import json
from pathlib import Path
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('submission_runtime',ROOT/'local/submission-runtime.py')
rt=importlib.util.module_from_spec(spec);spec.loader.exec_module(rt)
rt.guard()
values=dict(line.split('=',1) for line in rt.ENV.read_text().splitlines() if line and not line.startswith('#') and '=' in line)
API='http://127.0.0.1:'+values['BACKEND_PORT'];ES='http://127.0.0.1:'+values['ES_PORT']
checks=[]

def check(value,label,**extra):
    if not value:raise AssertionError(label)
    checks.append({'check':label,'passed':True,**extra})
    print('PASS '+label,flush=True)

def token(member):
    def enc(v):return base64.urlsafe_b64encode(v).decode().rstrip('=')
    h=enc(json.dumps({'alg':'HS256','typ':'JWT'}).encode())
    p=enc(json.dumps({'category':'access','email':f'synthetic-{member}@example.invalid','id':member,'role':'USER','iat':int(time.time()),'exp':int(time.time())+600}).encode())
    m=h+'.'+p
    return m+'.'+enc(hmac.new(values['SPRING_JWT_SECRET'].encode(),m.encode(),hashlib.sha256).digest())

def request(path,method='GET',data=None,member=None,base=API):
    headers={'Accept':'application/json'}
    if member:headers['Authorization']='Bearer '+token(member)
    payload=None
    if data is not None:
        boundary='submission-'+uuid.uuid4().hex
        payload=(f'--{boundary}\r\nContent-Disposition: form-data; name="data"; filename="data.json"\r\nContent-Type: application/json\r\n\r\n').encode()+json.dumps(data,ensure_ascii=False).encode()+f'\r\n--{boundary}--\r\n'.encode()
        headers['Content-Type']='multipart/form-data; boundary='+boundary
    r=urllib.request.Request(base+path,data=payload,headers=headers,method=method)
    try:
        with urllib.request.urlopen(r,timeout=10) as out:return out.status,json.load(out)
    except urllib.error.HTTPError as out:
        raw=out.read()
        return out.code,json.loads(raw) if raw else None

def sql(statement):
    rows=rt.compose('exec','-T','mysql','sh','-c','MYSQL_PWD="$MYSQL_PASSWORD" mysql --default-character-set=utf8mb4 -u"$MYSQL_USER" "$MYSQL_DATABASE" --batch --skip-column-names --raw',input=statement)
    return [json.loads(row) for row in rows.splitlines() if row.strip()]

def state(pid):
    return sql(f"SELECT JSON_OBJECT('revision',p.search_revision,'pending',(SELECT COUNT(*) FROM project_index_outbox o WHERE o.project_id=p.id AND o.status<>'SUCCEEDED'),'maxAttempts',(SELECT MAX(attempts) FROM project_index_outbox o WHERE o.project_id=p.id),'outboxCount',(SELECT COUNT(*) FROM project_index_outbox o WHERE o.project_id=p.id)) FROM project_post p WHERE p.id={int(pid)};")[0]

def wait(test,label,seconds=80):
    end=time.monotonic()+seconds
    while time.monotonic()<end:
        try:
            value=test()
            if value:return value
        except (urllib.error.URLError,TimeoutError,ConnectionError):pass
        time.sleep(1)
    raise AssertionError('Timed out: '+label)

def document(pid):
    status,result=request('/project-v2/_doc/'+str(pid),base=ES)
    return result if status==200 else None

def main():
    report=ROOT/'.local/submission-validation/outbox-smoke.json';report.parent.mkdir(parents=True,exist_ok=True)
    stopped=False;pid=None
    try:
        check(request('/projects/my')[0]==401,'anonymous personal list denied')
        check(request('/projects/43023')[0]==401,'anonymous private project denied')
        check(request('/projects/43023',member=47002)[0]==403,'other member private project denied')
        marker='submission'+''.join(chr(97+b%26) for b in uuid.uuid4().bytes)
        data={'title':marker,'content':'New isolated synthetic recovery fixture','projectCategory':'WEB','isPublic':True,'techCodeIds':[]}
        status,body=request('/projects','POST',data,47001)
        check(status==200 and type(body['data']) is int,'authenticated create committed')
        pid=body['data']
        wait(lambda:document(pid) and state(pid)['pending']==0,'first automatic index')
        check(document(pid)['_source']['title']==marker,'new project automatically indexed',projectId=pid)
        rt.compose('stop','--timeout','20','elasticsearch');stopped=True
        data['title']=marker+' changed'
        check(request('/projects/'+str(pid),'PUT',data,47001)[0]==200,'DB write succeeds while ES is stopped')
        wait(lambda:state(pid)['pending']>0 and state(pid)['maxAttempts']>0,'durable retry')
        pending=state(pid)
        check(pending['pending']>0,'outbox remains durable after delivery failure',state=pending)
        check(request('/projects/search?keyword='+marker)[0]==503,'actual search reports ES unavailable')
        rt.compose('start','elasticsearch');stopped=False
        wait(lambda:document(pid) and document(pid)['_source'].get('title')==data['title'] and state(pid)['pending']==0,'automatic recovery')
        wait(lambda: any(row['projectId']==pid for row in request('/projects/search?keyword='+marker)[1]['data']['content']),'search after index refresh')
        check(True,'ES resume automatically recovers latest revision without replay command',state=state(pid))
        data['isPublic']=False
        check(request('/projects/'+str(pid),'PUT',data,47001)[0]==200,'owner makes project private')
        wait(lambda:document(pid) and document(pid)['_source'].get('visible') is False and state(pid)['pending']==0,'private tombstone')
        check(set(document(pid)['_source'])=={'projectId','searchRevision','visible'},'private project emits minimal tombstone')
        check(request('/projects/'+str(pid))[0]==401,'anonymous new private detail denied')
        check(request('/projects/'+str(pid),member=47002)[0]==403,'other member new private detail denied')
        check(request('/projects/'+str(pid),member=47001)[0]==200,'owner private detail allowed')
        check(request('/projects/'+str(pid),'DELETE',member=47001)[0]==200,'owner deletion committed')
        wait(lambda:state(pid)['pending']==0,'delete tombstone delivered')
        check(request('/projects/'+str(pid),member=47001)[0]==404,'deleted detail unavailable')
        check(document(pid)['_source']['visible'] is False,'delete remains a tombstone')
        report.write_text(json.dumps({'passed':True,'scope':'New candidate only; actual HTTP, generated local JWT, MySQL, ES and outbox; no SIGKILL or original environment replay','checks':checks,'newSyntheticProjectId':pid,'doesNotApproveNewArtifactAsHistoricalBaseline':True},ensure_ascii=False,indent=2)+'\n')
    except Exception as failure:
        report.write_text(json.dumps({'passed':False,'errorType':type(failure).__name__,'checks':checks,'newSyntheticProjectId':pid},ensure_ascii=False,indent=2)+'\n')
        raise
    finally:
        if stopped:rt.compose('start','elasticsearch')
if __name__=='__main__':main()
