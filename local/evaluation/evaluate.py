#!/usr/bin/env python3
"""실제 Spring 검색 경로의 고정 관련성·기능·작은 로컬 왕복시간 평가. 검색 튜닝 없음."""
import argparse
import base64
from datetime import datetime, timezone
import hashlib
import hmac
import importlib.util
import json
import math
from pathlib import Path
import statistics
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import prepare
sys.path.insert(0,str(prepare.ROOT/'local'))
import runtime
HERE=Path(__file__).resolve().parent
KINDS={'job':'jobs','news':'news','project':'projects'}
CORPUS=json.loads((HERE/'corpus.json').read_text())
QUERIES=json.loads((HERE/'queries.json').read_text())['queries']


def dcg(grades,k=5):return sum((2**grade-1)/math.log2(rank+2) for rank,grade in enumerate(grades[:k]))
def ndcg(ids,labels,k=5):
    if len(ids)!=len(set(ids)):raise ValueError('duplicate ranked ID')
    unseen=set(ids)-set(labels)
    if unseen:raise ValueError('unjudged IDs: '+','.join(map(str,sorted(unseen))))
    ideal=dcg(sorted(labels.values(),reverse=True),k)
    return None if ideal==0 else dcg([labels[i] for i in ids],k)/ideal

def metric_checks():
    labels={1:2,2:1,3:0}
    known=(1+3/math.log2(3))/(3+1/math.log2(3))
    assert ndcg([1,2,3],labels)==1
    assert abs(ndcg([2,1,3],labels)-known)<1e-12
    assert ndcg([],labels)==0
    assert ndcg([3],{3:0}) is None
    for ids in ([99],[1,1]):
        try:ndcg(ids,labels)
        except ValueError:pass
        else:raise AssertionError('unsafe ranking accepted')
    return {'passed':6,'knownSwapScore':known,'perfect':1,'emptyWithRelevant':0,'noRelevant':'excluded from mean',
      'unjudged':'invalid query score, explicit error; never silently grade 0','duplicate':'invalid query score'}

def http(path,phase,query_id=None,identity=None):
    headers={'Accept':'application/json'}
    if identity:headers['Authorization']='Bearer '+identity
    request=urllib.request.Request(runtime.API_URL+path,headers=headers)
    started=time.perf_counter()
    try:
        with urllib.request.urlopen(request,timeout=20) as response:status,body=response.status,response.read()
    except urllib.error.HTTPError as response:status,body=response.code,response.read()
    except (urllib.error.URLError,TimeoutError) as error:
        return {'phase':phase,'queryId':query_id,'request':{'method':'GET','path':path},'status':0,
                'durationMs':(time.perf_counter()-started)*1000,'error':type(error).__name__,'response':None}
    elapsed=(time.perf_counter()-started)*1000
    try:payload=json.loads(body)
    except ValueError:payload={'parseError':True}
    return {'phase':phase,'queryId':query_id,'request':{'method':'GET','path':path},'status':status,
            'durationMs':elapsed,'response':payload}

def path_for(q, size=5, page=0):
    params={'keyword':q['keyword'],'size':size,'page':page,**q['filters']}
    if q['kind']=='project':params['sort']=q['sort']
    return '/'+KINDS[q['kind']]+'/search?'+urllib.parse.urlencode(params,doseq=True)

def content(record):return record['response']['data']['content']
def ids(record,kind):return [int(row['projectId' if kind=='project' else 'id']) for row in content(record)]
def percentile(values,p):return sorted(values)[max(0,math.ceil(len(values)*p)-1)] if values else None

def unexpected_search_http(records):
    """Search requests always expect 200; intentional authorization 401/403 are separate."""
    return [{'phase':r['phase'],'queryId':r.get('queryId'),'status':r['status']}
            for r in records if r['phase'] in ('relevance','warmup','measured') and r['status']!=200]


def run_failed(summary):
    return bool(summary['queryErrors'] or summary['functionalPassed']!=summary['functionalTotal']
                or summary['httpErrors'] or summary.get('unexpectedSearchHttpResponses')
                or summary.get('invalidSearchResponses') or summary.get('fatalErrors'))


def unified_matches_individual(record, records, keyword):
    """Compare actual grouped IDs with the frozen run's complete individual examples.

    The three fixed examples each return fewer than five rows per kind. Require a
    complete reference, so an empty group cannot pass merely as a safe subset.
    """
    if record['status']!=200:return False, {}
    grouped=record['response'].get('data',{})
    expected={}
    for kind,group in KINDS.items():
        if keyword=='"':
            expected[group]=[]
            continue
        query=next(q for q in QUERIES if q['kind']==kind and q['keyword']==keyword)
        reference=next((r for r in records if r['phase']=='relevance' and r.get('queryId')==query['id']),None)
        if reference is None or reference['status']!=200:return False, expected
        expected[group]=ids(reference,kind)
        # Exact fixture contract: do not infer full result IDs from a truncated top-5.
        if len(expected[group])>=5:return False, expected
        if kind=='project' and reference['response']['data']['page']['hasNext']:return False, expected
    actual={group:[row['projectId' if kind=='project' else 'id'] for row in grouped.get(group,{}).get('content',[])]
            for kind,group in KINDS.items()}
    return actual==expected, expected


def token(member):
    def b64(x):return base64.urlsafe_b64encode(x).decode().rstrip('=')
    head=b64(json.dumps({'alg':'HS256','typ':'JWT'}).encode())
    claim=b64(json.dumps({'category':'access','email':f'synthetic-{member}@example.invalid','id':member,'role':'USER',
                         'iat':int(time.time()),'exp':int(time.time())+300}).encode())
    message=head+'.'+claim
    return message+'.'+b64(hmac.new(runtime.VALUES['SPRING_JWT_SECRET'].encode(),message.encode(),hashlib.sha256).digest())

def reconcile():
    spec=importlib.util.spec_from_file_location('evaluation_sync',prepare.ROOT/'local/search-sync.py')
    sync=importlib.util.module_from_spec(spec);spec.loader.exec_module(sync)
    reports=[sync.compare(kind,save=False) for kind in ('job','news')]
    if any(r['differenceCount'] for r in reports):raise ValueError('job/news not fully synchronized')
    helpers=prepare.load_helpers()
    rows=helpers.mysql_json("SELECT JSON_OBJECT('id',id,'revision',search_revision,'visible',is_public AND NOT is_deleted,'views',view_count) FROM project_post ORDER BY id;")
    docs=helpers.request(runtime.ES_URL,'POST','/project-v2/_mget',{'ids':[str(p['id']) for p in rows]})['docs']
    for row,doc in zip(rows,docs):
        if not doc.get('found'):raise ValueError('project missing from ES')
        source=doc['_source'];visible=bool(row['visible'])
        if doc['_version']!=row['revision'] or source['searchRevision']!=row['revision'] or source['visible']!=visible:
            raise ValueError('project revision/visibility mismatch')
        if not visible and set(source)!={'projectId','searchRevision','visible'}:raise ValueError('nonminimal project tombstone')
        if visible:
            p=next(p for p in CORPUS['projects'] if p['id']==row['id'])
            expected={'projectId':p['id'],'searchRevision':row['revision'],'visible':True,'title':p['title'],
             'memberName':next(m['nickname'] for m in CORPUS['members'] if m['id']==p['memberId']),
             'projectCategory':p['category'],'projectTechs':sorted(p['techs']),'likeCount':0,
             'viewCount':row['views'],'createdAt':p['createdAt'][:10],'updatedAt':p['createdAt'][:10]}
            source['projectTechs']=sorted(source['projectTechs'])
            if source!=expected:raise ValueError('project content mismatch')
    pending=helpers.mysql_json("SELECT JSON_OBJECT('count',COUNT(*)) FROM project_index_outbox WHERE status<>'SUCCEEDED';")[0]['count']
    if pending:raise ValueError('pending project work before evaluation')
    return {'job':reports[0],'news':reports[1],'project':{'checked':len(rows),'differences':0,'unfinishedOutbox':pending}}

def functional(records):
    checks=[]
    def check(name, passed, **details):checks.append({'name':name,'passed':bool(passed),**details})
    def call(path,name,identity=None):
        r=http(path,'functional',name,identity);records.append(r);return r
    def search(kind,params,name):return call('/'+KINDS[kind]+'/search?'+urllib.parse.urlencode(params,doseq=True),name)
    live_jobs=[j for j in CORPUS['jobs'] if not j['deleted']]
    for region,category in [('서울','백엔드'),('부산','프론트엔드'),('대전','데이터엔지니어')]:
        expected={j['id'] for j in live_jobs if region in j['regions'] and category in j['jobCategories']}
        r=search('job',{'regions':region,'jobCategories':category,'size':100},'exact-filter-'+region+category)
        actual=set(ids(r,'job')) if r['status']==200 else set()
        check('exact-filter-'+region+category,r['status']==200 and actual==expected,expectedIds=sorted(expected),returnedIds=sorted(actual),excludedIds=sorted(set(j['id'] for j in live_jobs)-expected))
    r=search('job',{'regions':'서','jobCategories':'백엔드','size':100},'partial-region-is-not-exact')
    check('partial-region-is-not-exact',r['status']==200 and not ids(r,'job'))
    for kind in KINDS:
        r=search(kind,{'keyword':'zzqvevaluationnomatch','size':5},kind+'-zero')
        check(kind+'-intended-zero',r['status']==200 and not ids(r,kind))
        r=search(kind,{'keyword':'"Spring"','size':100},kind+'-quote')
        check(kind+'-quote-http200',r['status']==200)
        pages=[search(kind,{'keyword':'합성','size':5,'page':page,**({'sort':'LATEST'} if kind=='project' else {})},kind+'-page-'+str(page)) for page in range(5)]
        returned=[i for r in pages for i in ids(r,kind)]
        expected={d['id'] for d in CORPUS[KINDS[kind]] if not d['deleted'] and (kind!='project' or d['isPublic'])}
        check(kind+'-pages-live-ids',set(returned)==expected and len(returned)==len(set(returned)),expectedIds=sorted(expected),returnedIds=returned)
        if kind=='project':
            check('project-latest-sort',returned==sorted(expected,reverse=True))
            contract=all(r['response']['data']['page']['totalExact'] is False and r['response']['data']['page']['totalElements'] is None and r['response']['data']['page']['totalPages'] is None for r in pages)
            check('project-candidate-page-no-fake-total',contract and pages[0]['response']['data']['page']['hasNext'] is True and pages[-1]['response']['data']['page']['hasNext'] is False)
        else:
            check(kind+'-exact-total',all((r['response']['data'].get('totalElements',r['response']['data'].get('page',{}).get('totalElements'))==len(expected)) for r in pages))
    for sort in ('VIEWS','LIKES'):
        r=search('project',{'keyword':'합성','sort':sort,'size':100},'project-'+sort)
        expected=sorted((p for p in CORPUS['projects'] if p['isPublic'] and not p['deleted']),key=lambda p:(-(p['viewCount'] if sort=='VIEWS' else 0),p['createdAt']),reverse=False)
        # All initial view counts and creation dates grow with ID; LIKES ties use createdAt DESC.
        check('project-'+sort+'-contract',ids(r,'project')==sorted([p['id'] for p in expected],reverse=True))
    r=search('project',{'category':'SERVER','sort':'LATEST','size':100},'project-category')
    expected=sorted([p['id'] for p in CORPUS['projects'] if p['isPublic'] and not p['deleted'] and p['category']=='SERVER'],reverse=True)
    check('project-category-exact',ids(r,'project')==expected,expectedIds=expected,returnedIds=ids(r,'project'))
    for keyword in ('Spring','React','검색','"'):
        r=call('/search?'+urllib.parse.urlencode({'keyword':keyword,'size':100}),'unified-'+keyword)
        grouped=r['response'].get('data',{}) if r['status']==200 else {}
        safe=True
        for kind,group in KINDS.items():
            visible={d['id'] for d in CORPUS[group] if not d['deleted'] and (kind!='project' or d['isPublic'])}
            rows=grouped.get(group,{}).get('content',[])
            safe=safe and {row['projectId' if kind=='project' else 'id'] for row in rows}<=visible
        meta=grouped.get('projects',{}).get('page',{})
        same_ids,expected_ids=unified_matches_individual(r,records,keyword)
        check('unified-groups-visibility-'+keyword,r['status']==200 and set(grouped)==set(KINDS.values()) and safe and same_ids and meta.get('totalExact') is False and meta.get('totalElements') is None,expectedIdsByKind=expected_ids)
    # Authorization uses normal locally signed tokens only in this process, never in browser/evidence.
    for name,path,identity,status in [
      ('anonymous-private','/projects/43023',None,401),('other-private','/projects/43023',token(47002),403),
      ('anonymous-deleted','/projects/43024',None,404),('anonymous-personal','/projects/my',None,401),
      ('owner-personal','/projects/my',token(47001),200),
      ('owner-private-detail-after-latency','/projects/43023',token(47001),200)]:
        r=call(path,name,identity)
        if name in ('owner-personal','owner-private-detail-after-latency'):r['response']={'redacted':'synthetic private metadata omitted from public evidence'}
        check(name,r['status']==status,expectedStatus=status,actualStatus=r['status'])
    return checks

def search_response_error(record):
    if record['status']!=200:return 'unexpected_http_status'
    response=record.get('response')
    if not isinstance(response,dict) or not isinstance(response.get('data'),dict):return 'invalid_response_body'
    rows=response['data'].get('content')
    if not isinstance(rows,list) or not all(isinstance(row,dict) for row in rows):return 'invalid_content'
    return None


def score_means(scores):
    result={}
    for kind in KINDS:
        valid=[s['ndcgAt5'] for s in scores if s['kind']==kind and s.get('ndcgAt5') is not None]
        result[kind]=statistics.mean(valid) if valid else None
    return result


def capture_run(out,manifest,source,sync,latency_only=False):
    """After preflight, always preserve collected requests, including failed/incomplete runs."""
    if out.exists():raise ValueError('output directory already exists; evidence is append-only, choose a new run path')
    out.mkdir(parents=True)
    (out/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    records=[];scores=[];checks=[];fatal=[]
    started=datetime.now(timezone.utc).isoformat()
    stage='relevance'
    try:
        for q in ([] if latency_only else QUERIES):
            r=http(path_for(q),'relevance',q['id']);records.append(r)
            score={'queryId':q['id'],'kind':q['kind'],'keyword':q['keyword'],'sort':q['sort'],'status':r['status']}
            try:
                issue=search_response_error(r)
                if issue:raise ValueError(issue)
                returned=ids(r,q['kind']);labels={x['id']:x['grade'] for x in q['labels']}
                forbidden=sorted(set(returned)&set(q['forbiddenIds']))
                score.update(returnedIds=returned,grades=[labels.get(i) for i in returned],ndcgAt5=ndcg(returned,labels),
                             idcgAt5=dcg(sorted(labels.values(),reverse=True)),forbiddenReturned=forbidden)
                if forbidden:score['error']='forbidden ID returned'
            except (KeyError,TypeError,ValueError) as error:score.update(ndcgAt5=None,error=str(error))
            scores.append(score)
        # Fixed ordered requests; no detail-view mutation before time measurement ends.
        for phase,cycles in [('warmup',2),('measured',5)]:
            stage=phase
            for cycle in range(cycles):
                for q in QUERIES:
                    r=http(path_for(q),phase,q['id']);r['cycle']=cycle;records.append(r)
        stage='functional'
        if not latency_only:checks=functional(records)
    except Exception as error:
        # Class and stage only: do not serialize arbitrary exception text/credentials.
        fatal.append({'stage':stage,'errorType':type(error).__name__,'incomplete':True})
        if stage=='functional':checks=[{'name':'functional-run-incomplete','passed':False}]
    finally:
        # Write raw collected evidence before deriving any summary or aggregate.
        (out/'requests.jsonl').write_text(''.join(json.dumps(r,ensure_ascii=False)+'\n' for r in records))
        latency={}
        for kind in ['all',*KINDS]:
            measured=[r for r in records if r['phase']=='measured' and (kind=='all' or r['queryId'].startswith(kind+'-'))]
            successful=[r['durationMs'] for r in measured if search_response_error(r) is None]
            latency[kind]={'requests':len(measured),'errors':sum(search_response_error(r) is not None for r in measured),
                           'p50Ms':percentile(successful,.5),'p95Ms':percentile(successful,.95)}
        invalid=[{'phase':r['phase'],'queryId':r.get('queryId'),'error':search_response_error(r)} for r in records
                 if r['phase'] in ('relevance','warmup','measured') and r['status']==200 and search_response_error(r)]
        summary={'startedAtUtc':started,'finishedAtUtc':datetime.now(timezone.utc).isoformat(),
          'mode':'latency-only' if latency_only else 'baseline',
          'environment':{'composeProject':runtime.PROJECT,'apiOrigin':runtime.API_URL,'cpuHost':'MacBook Pro M4 Pro','memoryHostGiB':48,'concurrency':1,
            'warmupRequests':sum(r['phase']=='warmup' for r in records),'measuredRequests':sum(r['phase']=='measured' for r in records),
            'plannedWarmupRequests':60,'plannedMeasuredRequests':150,'totalHttpRequests':len(records),
            'apiTransport':'Python urllib HTTP/1.1 per request; local Docker API round trip',
            'esTook':'not exposed by application API; not measured','syncLatency':'not measured in this benchmark',
            'detailMutation':'excluded from relevance and latency requests'},
          'manifestHashes':manifest['dataHashes'],'baselineCommit':manifest['baselineCommit'],'metricUnitChecks':metric_checks(),
          'source':source,'syncBefore':sync,'ndcgAt5MeanByKind':score_means(scores) if scores else {},'queries':scores,
          'queryErrors':[s for s in scores if s.get('error')],'functional':checks,'functionalPassed':sum(c['passed'] for c in checks),
          'functionalTotal':len(checks),'latency':latency,'unexpectedSearchHttpResponses':unexpected_search_http(records),
          'invalidSearchResponses':invalid,'fatalErrors':fatal,'completed':not fatal,
          'httpErrors':sum(r['status']==0 or r['status']>=500 for r in records),
          'note':'합성 평가와 현재 정렬의 기준선. 관련성·기능·시간 지표를 합치지 않음. 기준선 후 데이터/라벨 변경 없음.'}
        (out/'summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
    return summary


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',default='docs/portfolio/evidence/evaluation/baseline')
    parser.add_argument('--unit-only',action='store_true')
    parser.add_argument('--latency-only',action='store_true',help='same frozen requests; keep earlier relevance evidence unchanged')
    args=parser.parse_args()
    unit=metric_checks()
    if args.unit_only:print(json.dumps(unit,ensure_ascii=False,indent=2));return
    prepare.guard();manifest=prepare.verify_freeze();source=prepare.check_corpus();sync=reconcile()
    summary=capture_run(prepare.ROOT/args.output,manifest,source,sync,args.latency_only)
    print(json.dumps({k:summary[k] for k in ('ndcgAt5MeanByKind','queryErrors','functionalPassed','functionalTotal','latency','httpErrors','fatalErrors')},ensure_ascii=False,indent=2))
    if run_failed(summary):sys.exit(1)

if __name__=='__main__':main()
