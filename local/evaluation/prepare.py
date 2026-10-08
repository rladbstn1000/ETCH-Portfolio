#!/usr/bin/env python3
"""고정 평가 코퍼스의 격리 DB 준비. ES 문서를 직접 쓰지 않는다."""
import argparse
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
from datetime import datetime, timezone
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[1]
sys.path.insert(0,str(ROOT/'local'))
BASELINE='a5a4d8397660ac454b761391841480fd58a0c8cc'

def load_helpers():
    spec=importlib.util.spec_from_file_location('eval_helpers',ROOT/'local/index-seed.py')
    module=importlib.util.module_from_spec(spec); spec.loader.exec_module(module); return module

def sha(path): return hashlib.sha256(path.read_bytes()).hexdigest()

def freeze():
    files=['corpus.json','queries.json']
    source_paths=sorted((ROOT/'etch/backend/business-server/src/main/java/com/ssafy/etch/search').glob('**/*.java'))
    source_paths+=sorted((ROOT/'etch/backend/business-server/src/main/resources/es').glob('*.json'))
    refs={str(p.relative_to(ROOT)):sha(p) for p in source_paths}
    for path,digest in refs.items():
        baseline=subprocess.check_output(['git','show',f'{BASELINE}:{path}'],cwd=ROOT)
        if hashlib.sha256(baseline).hexdigest()!=digest: raise ValueError('baseline search source/mapping changed: '+path)
    manifest={'version':'etch-synthetic-search-v1','baselineCommit':BASELINE,
      'frozenAtUtc':datetime.now(timezone.utc).isoformat(),'beforeAnyEvaluationSearch':True,
      'dataHashes':{name:sha(HERE/name) for name in files},'baselineFileHashes':refs,
      'policy':'라벨은 결과 확인 전에 고정. 평가 실행은 hash 불일치 시 거부하며 사후 성적 튜닝 금지.'}
    path=HERE/'manifest.json'
    if path.exists():
        current=json.loads(path.read_text())
        if current['dataHashes']!=manifest['dataHashes'] or current['baselineFileHashes']!=refs:
            raise ValueError('existing freeze differs; create explicitly documented new data version')
        return current
    path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    return manifest

def verify_freeze():
    manifest=json.loads((HERE/'manifest.json').read_text())
    for name,digest in manifest['dataHashes'].items():
        if sha(HERE/name)!=digest: raise ValueError('frozen data changed: '+name)
    for name,digest in manifest['baselineFileHashes'].items():
        if sha(ROOT/name)!=digest: raise ValueError('baseline code changed: '+name)
    return manifest

def guard():
    import runtime
    project=runtime.PROJECT
    if not project.startswith('etch-phase4-') or project=='etch-local':
        raise ValueError('evaluation writes require explicit ETCH_COMPOSE_PROJECT=etch-phase4-*')
    if not os.environ.get('ETCH_ENV_FILE'): raise ValueError('explicit isolated ETCH_ENV_FILE is required')

# UTF-8 SQL literals avoid quoting ambiguity; only synthetic checked-in content is passed.
def lit(value):
    if value is None:return 'NULL'
    if isinstance(value,bool):return '1' if value else '0'
    if isinstance(value,int):return str(value)
    if value=='':return "''"
    return "CONVERT(0x"+str(value).encode().hex()+" USING utf8mb4)"

def ins(table, columns, rows):
    return 'INSERT INTO '+table+' ('+','.join(columns)+') VALUES '+','.join('('+','.join(lit(v) for v in row)+')' for row in rows)+';'

def seed():
    guard(); verify_freeze(); helpers=load_helpers()
    corpus=json.loads((HERE/'corpus.json').read_text())
    marker=helpers.mysql_json("SELECT JSON_OBJECT('jobs',(SELECT COUNT(*) FROM job),'news',(SELECT COUNT(*) FROM news),'projects',(SELECT COUNT(*) FROM project_post),'states',(SELECT COUNT(*) FROM search_sync_state));")[0]
    if any(marker.values()):
        check_corpus(helpers,corpus)
        return {'operation':'already-prepared-no-write','counts':marker,'corpusHash':sha(HERE/'corpus.json')}
    sql=['SET NAMES utf8mb4; START TRANSACTION;']
    sql.append(ins('company',['id','name','business_no','industry','summary'],[(c['id'],c['name'],f"eval-company-{c['id']}",'IT','고정 합성 데모의 가상 기업') for c in corpus['companies']]))
    sql.append(ins('member',['id','nickname','email','phoneNumber','gender','birth','role','isDeleted','refreshToken'],[(m['id'],m['nickname'],f"synthetic-{m['id']}@example.invalid",f"synthetic-phone-{m['id']}",'UNSPECIFIED','2000-01-01','USER',False,'') for m in corpus['members']]))
    jobs=corpus['jobs']
    sql.append(ins('job',['id','title','company_id','company_name','region','industry','job_category','work_type','education_level','opening_date','expiration_date','created_at','external_job_id'],[(j['id'],j['title'],j['companyId'],j['companyName'],','.join(j['regions']),','.join(j['industries']),','.join(j['jobCategories']),j['workType'],j['educationLevel'],j['openingDate'],j['expirationDate'],j['openingDate'][:10],j['externalJobId']) for j in jobs]))
    news=corpus['news']
    sql.append(ins('news',['id','title','description','company_id','company_name','published_at','url','thumbnail_url'],[(n['id'],n['title'],n['summary'],n['companyId'],n['companyName'],n['publishedAt'],n['link'],n['thumbnailUrl']) for n in news]))
    projects=corpus['projects']
    sql.append(ins('project_post',['id','title','content','member_id','category','created_at','updated_at','is_public','is_deleted','view_count','search_revision'],[(p['id'],p['title'],p['content'],p['memberId'],p['category'],p['createdAt'],p['createdAt'],p['isPublic'],p['deleted'],p['viewCount'],1) for p in projects]))
    techs=sorted({t for p in projects for t in p['techs']}); tech_ids={t:45001+i for i,t in enumerate(techs)}
    sql.append(ins('tech_code',['id','code_name','tech_category'],[(tech_ids[t],t,'DEMO') for t in techs]))
    sql.append(ins('project_tech',['id','project_post_id','tech_code_id'],[(48001+i,p['id'],tech_ids[t]) for i,(p,t) in enumerate((p,t) for p in projects for t in p['techs'])]))
    # The same atomic bootstrap/outbox convention as phase2 local seed; worker alone writes ES.
    sql.append('INSERT INTO project_index_outbox(project_id,revision) SELECT id,search_revision FROM project_post WHERE id BETWEEN 43001 AND 43024;')
    sql.append('DELETE FROM job WHERE id=41024; DELETE FROM news WHERE id=42024; COMMIT;')
    helpers.mysql_json('\n'.join(sql))
    check_corpus(helpers,corpus)
    return {'operation':'inserted-atomic-source-and-outbox','jobsLive':23,'newsLive':23,'projects':24,
       'projectPublic':21,'projectPrivate':2,'projectDeleted':1,'jobNewsTombstones':2,'corpusHash':sha(HERE/'corpus.json')}

def check_corpus(helpers=None, corpus=None):
    helpers=helpers or load_helpers(); corpus=corpus or json.loads((HERE/'corpus.json').read_text())
    # Full source fields read back. Tracking timestamps/revision and detail-view counters are separate.
    jobs=helpers.mysql_json("SELECT JSON_OBJECT('id',id,'title',title,'companyId',company_id,'companyName',company_name,'region',region,'industry',industry,'category',job_category,'workType',work_type,'educationLevel',education_level,'openingDate',DATE_FORMAT(opening_date,'%Y-%m-%dT%H:%i:%s'),'expirationDate',DATE_FORMAT(expiration_date,'%Y-%m-%dT%H:%i:%s'),'externalJobId',external_job_id) FROM job ORDER BY id;")
    news=helpers.mysql_json("SELECT JSON_OBJECT('id',id,'title',title,'summary',description,'companyId',company_id,'companyName',company_name,'publishedAt',DATE_FORMAT(published_at,'%Y-%m-%dT%H:%i:%s'),'link',url,'thumbnailUrl',thumbnail_url) FROM news ORDER BY id;")
    projects=helpers.mysql_json("SELECT JSON_OBJECT('id',id,'title',title,'content',content,'memberId',member_id,'category',category,'createdAt',DATE_FORMAT(created_at,'%Y-%m-%dT%H:%i:%s'),'isPublic',is_public+0,'deleted',is_deleted+0,'techs',(SELECT JSON_ARRAYAGG(t.code_name) FROM project_tech pt JOIN tech_code t ON t.id=pt.tech_code_id WHERE pt.project_post_id=p.id)) FROM project_post p ORDER BY id;")
    expected_jobs=[]
    for j in corpus['jobs']:
        if j['deleted']:continue
        row={k:v for k,v in j.items() if k not in ('deleted','regions','industries','jobCategories')}
        row.update(region=','.join(j['regions']),industry=','.join(j['industries']),category=','.join(j['jobCategories']))
        expected_jobs.append(row)
    expected_news=[{k:v for k,v in n.items() if k!='deleted'} for n in corpus['news'] if not n['deleted']]
    expected_projects=[{k:v for k,v in p.items() if k!='viewCount'} for p in corpus['projects']]
    for p in projects+expected_projects:p['techs']=sorted(p['techs'])
    if jobs!=expected_jobs or news!=expected_news or projects!=expected_projects:
        raise ValueError('DB corpus differs; no overwrite/reset performed. Use a new isolated environment.')
    counts=helpers.mysql_json("SELECT JSON_OBJECT('states',(SELECT COUNT(*) FROM search_sync_state),'tombstones',(SELECT COUNT(*) FROM search_sync_state WHERE deleted),'projects',(SELECT COUNT(*) FROM project_post));")[0]
    if counts!={'states':48,'tombstones':2,'projects':24}: raise ValueError('tracking/bootstrap count differs')
    return {'sourceMatch':True,'sourceCounts':{'job':len(jobs),'news':len(news),'project':len(projects)},'trackingCounts':counts}

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('action',choices=['freeze','verify','seed','check'])
    action=parser.parse_args().action
    try:
        result={'freeze':freeze,'verify':verify_freeze,'seed':seed,'check':check_corpus}[action]()
        print(json.dumps(result,ensure_ascii=False,indent=2))
    except (ValueError,subprocess.CalledProcessError) as error:
        print('Evaluation preparation failed: '+(str(error) if isinstance(error,ValueError) else type(error).__name__),file=sys.stderr);sys.exit(1)
