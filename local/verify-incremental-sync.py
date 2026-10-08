#!/usr/bin/env python3
"""실제 MySQL/Logstash/ES 증분 검증. 기존 데이터 보존, 새 합성 fixture만 수정.
ETCH ES/Logstash를 중단·재생성하며 종료 시 기본 120초/10초 설정으로 복원한다.
자동 복구와 명시적 운영자 복구, 제한된 SQL/문서 오류 주입을 구분해 출력한다.
"""
import ast
import argparse
from datetime import datetime, timezone
import importlib.util
import json
from pathlib import Path
import re
import subprocess
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid

ROOT = Path(__file__).resolve().parents[1]
def load(name, path):
    spec = importlib.util.spec_from_file_location(name, ROOT / path)
    obj = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(obj)
    return obj
op = load('incremental_operator', 'local/search-sync.py')
BASE = 'http://localhost:18476'
RUN = 'sync' + ''.join(chr(97 + byte % 26) for byte in uuid.uuid4().bytes)
OVERLAP, COUNT = 20, 120
WORK = ROOT / '.local' / ('incremental-' + RUN)
OVERRIDE = WORK / 'compose.json'
ids = {'job': [], 'news': []}
injected = set()
transactions = []
started = False


def note(label, **details):
    print(label + (': ' + json.dumps(details, ensure_ascii=False, sort_keys=True) if details else ''), flush=True)
def check(condition, label, **details):
    if not condition:
        raise AssertionError(label)
    note('PASS ' + label, **details)
def wait(predicate, label, seconds=100):
    end, last = time.monotonic() + seconds, None
    while time.monotonic() < end:
        try:
            if predicate():
                return
        except (OSError, urllib.error.URLError, subprocess.CalledProcessError, KeyError, ValueError) as failure:
            last = type(failure).__name__
        time.sleep(0.25)
    raise AssertionError('timeout: ' + label + '; last=' + str(last))
def pause(seconds):
    end = time.monotonic() + seconds
    while time.monotonic() < end:
        time.sleep(min(0.5, end - time.monotonic()))
def literal(value):
    if value is None: return 'NULL'
    if isinstance(value, int): return str(value)
    return "'" + str(value).replace('\\', '\\\\').replace("'", "''") + "'"
def sql(statement): return op.sql(statement)
def admin_command(unbuffered=False):
    extra = '--unbuffered ' if unbuffered else ''
    return op.h.compose('exec', '-T', 'mysql', 'sh', '-c',
        'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql ' + extra + '--default-character-set=utf8mb4 -uroot "$MYSQL_DATABASE" --batch --skip-column-names --raw')
def admin(statement):
    result = subprocess.run(admin_command(), input=statement, text=True, capture_output=True, check=True)
    return [json.loads(line) for line in result.stdout.splitlines() if line.strip()]
def compose(*args, test=False):
    cmd = ['docker', 'compose', '-f', str(ROOT / 'compose.local.yml')]
    if test: cmd += ['-f', str(OVERRIDE)]
    result = subprocess.run(cmd + list(args), cwd=ROOT, text=True, capture_output=True)
    if result.returncode:
        raise RuntimeError('ETCH compose operation failed: ' + ' '.join(args[:3]))
    return result.stdout.strip()
def http(path, expected=200):
    try:
        with urllib.request.urlopen(BASE + path, timeout=20) as response:
            code, body = response.status, response.read()
    except urllib.error.HTTPError as response:
        code, body = response.code, response.read()
    if expected is not None: assert code == expected, f'HTTP {path.split("?")[0]} expected {expected}, got {code}'
    return code, json.loads(body) if body else None

def stats():
    with urllib.request.urlopen('http://localhost:19600/_node/stats/pipelines', timeout=5) as response:
        return json.load(response)['pipelines']
def ready():
    def running():
        values=stats()
        return all(isinstance(values.get(name,{}).get('events'),dict)
                   and isinstance(values.get(name,{}).get('queue'),dict)
                   for name in ('jobs','news'))
    wait(running, 'both Logstash pipelines have running event and queue statistics', 120)
def checkpoint(kind):
    plural = 'jobs' if kind == 'job' else 'news'
    raw = compose('exec', '-T', 'logstash', 'cat', '/usr/share/logstash/data/checkpoints/' + plural + '.yml')
    matched = re.search(r'(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})(?:\.(\d+))?', raw)
    if not matched: raise ValueError('checkpoint unavailable')
    return datetime.fromisoformat(matched.group(1) + 'T' + matched.group(2) + '.' + (matched.group(3) or '0')[:6].ljust(6, '0') + '+00:00')
def utc(value): return datetime.fromisoformat(value.replace('Z', '+00:00'))
def state(kind, doc_id): return op.state_rows(kind, [doc_id])[doc_id]
def synced(kind, selected=None): return op.compare(kind, selected or ids[kind], save=False)['differenceCount'] == 0
def await_synced(kind, selected=None, seconds=110):
    wait(lambda: synced(kind, selected), kind + ' DB/ES IDs, revisions and normalized payload hashes match', seconds)
def search_check(kind, doc_id, keyword, expected=True):
    plural = 'jobs' if kind == 'job' else 'news'
    def found():
        _, response = http('/' + plural + '/search?' + urllib.parse.urlencode({'keyword': keyword, 'size': 200}))
        return any(row['id'] == doc_id for row in response['data']['content']) == expected
    wait(found, kind + ' actual search API visibility')
def configure(slow=False):
    WORK.mkdir(parents=True, exist_ok=True)
    service = {'environment': {'LOGSTASH_SCHEDULE': '*/2 * * * * * UTC', 'SYNC_OVERLAP_SECONDS': str(OVERLAP), 'SYNC_FETCH_SIZE': '50'}}
    if slow:
        query_dir = WORK / 'query'; query_dir.mkdir(exist_ok=True)
        for name in ('jobs', 'news'):
            text = (ROOT / 'local/logstash/query' / (name + '.sql')).read_text()
            if name == 'jobs': text = text.replace('source_id,', 'SLEEP(0.02) AS verification_delay, source_id,', 1)
            (query_dir / (name + '.sql')).write_text(text)
        service['volumes'] = [str(query_dir) + ':/usr/share/logstash/query:ro']
    OVERRIDE.write_text(json.dumps({'services': {'logstash': service}}, indent=2))
def recreate(slow=False):
    configure(slow)
    compose('up', '-d', '--no-deps', '--force-recreate', 'logstash', test=True)
    ready()
def global_fetches():
    # MySQL 8.4 exposes Com_* counters via SHOW; performance_schema.global_status omits them.
    result = subprocess.run(admin_command(), input="SHOW GLOBAL STATUS LIKE 'Com_stmt_fetch';",
                            text=True, capture_output=True, check=True)
    return int(result.stdout.strip().split('\t')[-1])
def original_hashes():
    return {kind: {key: op.digest(value) for key, value in op.source_rows(kind).items() if key not in ids[kind]} for kind in ids}
def project_hashes():
    return sql("SELECT JSON_OBJECT('id',id,'hash',SHA2(CONCAT_WS(CHAR(9),title,content,is_public,is_deleted,view_count,search_revision),256)) FROM project_post ORDER BY id;")
def create_fixtures():
    company = sql(f"INSERT INTO company(name,business_no) VALUES('{RUN}company','{RUN}'); SELECT JSON_OBJECT('id',LAST_INSERT_ID());")[0]['id']
    job_values, news_values = [], []
    for number in range(COUNT):
        job_values.append(f"('{RUN}job {number}',{company},'{RUN}company','서울, 경기','IT','백엔드, DevOps/클라우드','정규직','무관','2026-09-01 09:01:02','2099-10-01 18:02:03','{RUN}-job-{number}')")
        news_values.append(f"({company},'{RUN}company','{RUN}news {number}','fixture summary','https://example.invalid/{RUN}/news/{number}','2026-09-02 12:03:04')")
    sql("START TRANSACTION; INSERT INTO job(title,company_id,company_name,region,industry,job_category,work_type,education_level,opening_date,expiration_date,external_job_id) VALUES " + ','.join(job_values) + "; INSERT INTO news(company_id,company_name,title,description,url,published_at) VALUES " + ','.join(news_values) + "; COMMIT;")
    ids['job'] = [row['id'] for row in sql(f"SELECT JSON_OBJECT('id',id) FROM job WHERE company_id={company} ORDER BY id;")]
    ids['news'] = [row['id'] for row in sql(f"SELECT JSON_OBJECT('id',id) FROM news WHERE company_id={company} ORDER BY id;")]
    # Bounded tracking timestamp injection: every row shares one UTC time, above 50-row fetch boundary.
    sql(f"START TRANSACTION; SET @fixture_time=UTC_TIMESTAMP(6); UPDATE search_sync_state SET changed_at=@fixture_time WHERE (kind='job' AND source_id IN ({','.join(map(str,ids['job']))})) OR (kind='news' AND source_id IN ({','.join(map(str,ids['news']))})); COMMIT;")
    check(len(ids['job']) == len(ids['news']) == COUNT, 'isolated new fixture IDs created', jobs=COUNT, news=COUNT, companyId=company)
    return company

def collector_sql(file, fn, var):
    tree = ast.parse((ROOT / 'etch/backend/batch-server' / file).read_text())
    node = next(x for x in tree.body if isinstance(x, ast.FunctionDef) and x.name == fn)
    return ast.literal_eval(next(x.value for x in node.body if isinstance(x, ast.Assign) and any(isinstance(v, ast.Name) and v.id == var for v in x.targets)))
def repeated_collectors(company):
    before = {kind: state(kind, ids[kind][0]) for kind in ids}
    job = dict(title=RUN+'job 0', company_id=company, company_name=RUN+'company', region='서울, 경기', industry='IT',
        job_category='백엔드, DevOps/클라우드', work_type='정규직', education_level='무관', opening_date='2026-09-01 09:01:02', expiration_date='2099-10-01 18:02:03', external_job_id=RUN+'-job-0')
    sql(collector_sql('fetch_job.py','save_cleaned_jobs','insert_sql') % {k:literal(v) for k,v in job.items()})
    news = (company,RUN+'company',RUN+'news 0','fixture summary',None,'https://example.invalid/'+RUN+'/news/0','2026-09-02 12:03:04')
    sql(collector_sql('fetch_news.py','_insert_articles','sql') % tuple(map(literal,news)))
    check(all(before[k] == state(k,ids[k][0]) for k in ids), 'actual collector duplicate SQL preserves revision and changed_at')
    rows = sql(f"SELECT JSON_OBJECT('jobs',(SELECT COUNT(*) FROM job WHERE company_id={company}),'news',(SELECT COUNT(*) FROM news WHERE company_id={company}));")[0]
    check(rows == {'jobs':COUNT,'news':COUNT}, 'external ID / SHA-256 repeat collection does not duplicate source rows')
    for kind in ids: await_synced(kind)
    check(True, 'same IDs remain exactly one ES document per source', jobs=len(op.es_rows('job',ids['job'])), news=len(op.es_rows('news',ids['news'])))

def transaction_update(doc_id, title):
    process = subprocess.Popen(admin_command(True), stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    transactions.append(process)
    process.stdin.write(f"START TRANSACTION; UPDATE job SET title='{title}' WHERE id={doc_id}; SELECT JSON_OBJECT('changed',DATE_FORMAT(changed_at,'%Y-%m-%dT%H:%i:%s.%fZ')) FROM search_sync_state WHERE kind='job' AND source_id={doc_id};\n")
    process.stdin.flush()
    stamp = utc(json.loads(process.stdout.readline())['changed'])
    return process, stamp

def commit(process):
    _, errors = process.communicate('COMMIT;\n',timeout=10)
    assert process.returncode == 0, 'synthetic transaction commit failed'
    transactions.remove(process)

def delayed_commits():
    doc_id = ids['job'][2]
    process, stamp = transaction_update(doc_id,RUN+'withinwindow')
    wait(lambda: (checkpoint('job') - stamp).total_seconds() >= 5, 'watermark advances during uncommitted update')
    commit(process)
    await_synced('job',[doc_id])
    check(True, 'commit delayed inside 20-second overlap is delivered automatically')
    process, stamp = transaction_update(doc_id,RUN+'outsidewindow')
    wait(lambda: (checkpoint('job') - stamp).total_seconds() > OVERLAP+3, 'watermark passes delayed transaction overlap', 50)
    commit(process)
    pause(5)
    report = op.compare('job',[doc_id],save=True)
    check(report['differenceCount'] == 1 and 'stale_document' in report['differences'][0]['reasons'], 'commit beyond overlap is explicitly detected by per-ID reconciliation', reasons=report['differences'][0]['reasons'])
    note('OPERATOR late-commit repair (separate from automatic polling)')
    op.repair('job',[doc_id],apply=True)
    await_synced('job',[doc_id]); search_check('job',doc_id,RUN+'outsidewindow')
    check(True, 'late-commit operator repair uses current DB and restores actual search')

def query_change():
    recreate(slow=True)
    sql(f"UPDATE search_sync_state SET changed_at=UTC_TIMESTAMP(6) WHERE kind='job' AND source_id IN ({','.join(map(str,ids['job']))});")
    def executing():
        return admin("SELECT JSON_OBJECT('n',COUNT(*)) FROM information_schema.processlist WHERE INFO LIKE 'SELECT /* etch_sync_job */%SLEEP%';")[0]['n'] > 0
    wait(executing,'controlled slow cursor SELECT running',20)
    doc_id = ids['job'][3]
    sql(f"UPDATE job SET title='{RUN}duringselect' WHERE id={doc_id};")
    await_synced('job',[doc_id]); search_check('job',doc_id,RUN+'duringselect')
    check(True, 'source update committed during actual delayed SELECT is captured by following overlap poll')
    recreate()

def future_boundary():
    doc_id = ids['job'][4]
    previous_version = op.es_document('job',doc_id)['_version']
    suffix = ''.join(chr(97+byte%26) for byte in uuid.uuid4().bytes[:4])
    sql(f"START TRANSACTION; UPDATE job SET title='{RUN}futuretracking{suffix}' WHERE id={doc_id}; UPDATE search_sync_state SET changed_at='2999-01-01 00:00:00' WHERE kind='job' AND source_id={doc_id}; COMMIT;")
    injected.add(('job',doc_id))
    before = checkpoint('job'); pause(5); after = checkpoint('job')
    check(after >= before and after.year < 2999, 'injected future timestamp does not advance query-start checkpoint into future')
    check(op.es_document('job',doc_id)['_version'] == previous_version, 'atomically injected future change is excluded from ES delivery')
    report = op.compare('job',[doc_id],save=True)
    check('future_tracking_timestamp' in report['differences'][0]['reasons'], 'future tracking timestamp is excluded and diagnosed')
    note('OPERATOR future-timestamp repair')
    op.repair('job',[doc_id],apply=True); injected.discard(('job',doc_id)); await_synced('job',[doc_id])

def outage():
    selected = {kind: ids[kind][10:15] for kind in ids}
    compose('stop','elasticsearch'); note('ACTION stop ETCH Elasticsearch')
    for kind in ids:
        sql(f"UPDATE {kind} SET title=CONCAT('{RUN}outage',id) WHERE id IN ({','.join(map(str,selected[kind]))});")
    stamps = {kind: utc(state(kind,selected[kind][0])['changedAt']) for kind in ids}
    wait(lambda: all((checkpoint(kind)-stamps[kind]).total_seconds() > OVERLAP+3 for kind in ids),
         'both JDBC positions advance past outage changes plus complete overlap while ES is down', 70)
    wait(lambda: all(stats()[p]['queue']['events_count'] > 0 for p in ('jobs','news')), 'durable PQ holds unacknowledged events', 40)
    saved = {kind: checkpoint(kind) for kind in ids}
    for kind in ids:
        cp=saved[kind].strftime('%Y-%m-%d %H:%M:%S.%f')
        candidates=sql(f"SELECT JSON_OBJECT('id',source_id) FROM search_sync_state WHERE kind='{kind}' AND source_id IN ({','.join(map(str,selected[kind]))}) AND changed_at>=TIMESTAMPADD(SECOND,-{OVERLAP},'{cp}') AND changed_at<=UTC_TIMESTAMP(6);")
        check(candidates==[], kind+' outage IDs are outside restart JDBC overlap: recovery must come from persisted queue', queryReturned=0)
    check(http('/jobs/search?keyword='+RUN,expected=None)[0] == 503, 'ES outage search returns HTTP503 instead of empty success')
    note('PQ_BEFORE_KILL', pipelines={p:{'events':v['events'],'queue':v['queue']} for p,v in stats().items()})
    compose('kill','-s','SIGKILL','logstash'); note('ACTION actual Logstash SIGKILL with advanced checkpoints and queued events')
    compose('up','-d','--no-deps','--force-recreate','logstash',test=True)
    wait(lambda: all(checkpoint(k) >= saved[k] for k in ids),'persistent checkpoints survive container recreation',60)
    start = time.monotonic(); compose('start','elasticsearch')
    ready()
    for kind in ids:
        await_synced(kind,seconds=150)
        search_check(kind,selected[kind][0],RUN+'outage')
    check(True, 'persistent PQ + checkpoints restore all current fixture documents and actual search without repair/seed/reindex', recoverySeconds=round(time.monotonic()-start,3))


def repeat_outage(marker):
    global RUN, started
    if not re.fullmatch(r'sync[a-z]{16}', marker):
        raise ValueError('existing synthetic RUN marker required')
    RUN=marker
    companies=sql(f"SELECT JSON_OBJECT('id',id) FROM company WHERE business_no='{marker}';")
    if len(companies)!=1: raise ValueError('fixture company not found')
    company=companies[0]['id']
    for kind in ids:
        ids[kind]=[row['id'] for row in sql(f'SELECT JSON_OBJECT(\'id\',id) FROM {kind} WHERE company_id={company} ORDER BY id;')]
        if len(ids[kind])<20: raise ValueError('insufficient original synthetic fixture rows')
    note('RUN focused persisted-PQ verification', fixtureRun=marker, overlapSeconds=OVERLAP)
    started=True
    recreate()
    # Force a new source version even if this fixture underwent a previous outage test.
    for kind in ids:
        sql(f"UPDATE {kind} SET title=CONCAT('{RUN}beforepqverification',id) WHERE id IN ({','.join(map(str,ids[kind][10:15]))});")
        await_synced(kind)
    future_boundary()
    outage()
    note('COMPLETE focused PQ recovery; JDBC overlap could not redeliver affected IDs')

def dlq_bytes():
    raw = compose('exec','-T','logstash','sh','-c','find /usr/share/logstash/data/dead_letter_queue -type f -name "*.log" -printf "%s\\n" 2>/dev/null || true')
    return sum(int(line) for line in raw.splitlines() if line.strip().isdigit())
def mapping_fault():
    bad, good = ids['job'][20:22]
    before = dlq_bytes()
    sql(f"START TRANSACTION; UPDATE search_sync_state SET payload=JSON_SET(payload,'$.title',JSON_OBJECT('invalid',TRUE)),revision=revision+1,changed_at=UTC_TIMESTAMP(6) WHERE kind='job' AND source_id={bad}; UPDATE job SET title='{RUN}healthybesidefailure' WHERE id={good}; COMMIT;")
    injected.add(('job',bad))
    wait(lambda: dlq_bytes() > before,'mapping failure written to persisted DLQ',40)
    await_synced('job',[good])
    check(op.compare('job',[bad],save=True)['differenceCount'] == 1, 'mapping error stays distinguishable while healthy row is indexed', dlqBytesBefore=before,dlqBytesAfter=dlq_bytes())
    sql(f"UPDATE job SET title='{RUN}mappingfixedlatest' WHERE id={bad};")
    note('OPERATOR mapping-failure repair: current source reread, old DLQ JSON never replayed')
    op.repair('job',[bad],apply=True); injected.discard(('job',bad)); await_synced('job',[bad]); search_check('job',bad,RUN+'mappingfixedlatest')
    check(dlq_bytes() > before, 'latest source restored while original failure remains inspectable in DLQ')

def contracts(company):
    for kind in ids:
        doc_id = ids[kind][30]
        sql(f'DELETE FROM {kind} WHERE id={doc_id};')
        await_synced(kind,[doc_id])
        source = op.es_document(kind,doc_id)['_source']
        check(set(source) == {kind+'Id','syncRevision','deleted'} and source['deleted'], kind+' physical deletion is durable minimal ES tombstone')
        search_check(kind,doc_id,RUN,False)
    expired = ids['job'][31]
    sql(f"UPDATE job SET title='{RUN}expiredjob',expiration_date='2000-01-01 09:00:00' WHERE id={expired};")
    await_synced('job',[expired]); search_check('job',expired,RUN+'expiredjob')
    check(not op.es_document('job',expired)['_source']['deleted'], 'expired posting remains a posting and is not treated as deletion')
    before = {kind: state(kind,ids[kind][32]) for kind in ids}
    sql(f"UPDATE company SET name='{RUN}masterchanged' WHERE id={company};")
    check(all(before[k] == state(k,ids[k][32]) for k in ids), 'company master rename does not rewrite collected company snapshot')
    for kind in ids:
        doc_id=ids[kind][32]
        sql(f"UPDATE {kind} SET company_name='{RUN}snapshotchanged' WHERE id={doc_id};")
        await_synced(kind,[doc_id]); search_check(kind,doc_id,RUN+'snapshotchanged')
    check(True, 'new collected company-name snapshot is reflected by incremental delivery')

def reconciliation():
    missing, stale, deleted = ids['job'][40:43]
    note('FAULT deliberate missing/corrupt/deleted-left document injection for operator reconciliation only')
    op.request('DELETE',f'/job-v3/_doc/{missing}')
    injected.add(('job',missing))
    old = op.es_document('job',stale)
    corrupt = dict(old['_source']); corrupt['title']='controlled stale fixture'; corrupt['syncRevision']=0
    op.request('PUT',f'/job-v3/_doc/{stale}?version_type=external_gte&version={old["_version"]+50}',corrupt)
    injected.add(('job',stale))
    retained = op.es_document('job',deleted)['_source']
    sql(f'DELETE FROM job WHERE id={deleted};'); await_synced('job',[deleted])
    tomb = op.es_document('job',deleted)
    op.request('PUT',f'/job-v3/_doc/{deleted}?version_type=external_gte&version={tomb["_version"]+50}',retained)
    injected.add(('job',deleted))
    report=op.compare('job',[missing,stale,deleted],save=True)
    reasons={row['id']:row['reasons'] for row in report['differences']}
    check('missing_document' in reasons.get(missing,[]) and 'stale_document' in reasons.get(stale,[])
          and 'deleted_document_left' in reasons.get(deleted,[]), 'per-ID revision/content hashes distinguish missing, stale, and deleted-left documents', differences=reasons)
    note('OPERATOR explicit current-state repair (not automatic loss recovery)')
    op.repair('job',[missing,stale,deleted],apply=True); await_synced('job',[missing,stale,deleted])
    for doc_id in (missing,stale,deleted): injected.discard(('job',doc_id))
    current=op.es_document('job',stale)
    try:
        op.request('PUT',f'/job-v3/_doc/{stale}?version_type=external_gte&version={old["_version"]}',old['_source'])
        raise AssertionError('old delayed snapshot accepted')
    except urllib.error.HTTPError as error:
        check(error.code==409,'controlled delayed older-version replay is rejected by actual ES version fence')
    check(op.es_document('job',stale)['_source']==current['_source'], 'stale replay cannot overwrite repaired latest source')

def measurement():
    note('MEASUREMENT waiting for unchanged fixture rows to leave 20-second overlap')
    def quiet_scope(kind):
        cp = checkpoint(kind)
        return all((cp-utc(row['changedAt'])).total_seconds()>OVERLAP+2 for row in op.state_rows(kind,ids[kind]).values())
    for kind in ids:
        wait(lambda kind=kind: quiet_scope(kind), kind+' quiet overlap expiry',45)
    def returned(kind):
        cp=checkpoint(kind).strftime('%Y-%m-%d %H:%M:%S.%f')
        return len(sql(f"SELECT JSON_OBJECT('id',source_id) FROM search_sync_state WHERE kind='{kind}' AND changed_at>=TIMESTAMPADD(SECOND,-{OVERLAP},'{cp}') AND changed_at<=UTC_TIMESTAMP(6) ORDER BY changed_at,source_id;"))
    quiet={kind:returned(kind) for kind in ids}
    check(all(value==0 for value in quiet.values()), 'unchanged normal cycle returns zero rows after overlap', returnedRows=quiet)
    full=sql("SELECT JSON_OBJECT('job',(SELECT COUNT(*) FROM job),'news',(SELECT COUNT(*) FROM news));")[0]
    before={p:v['events']['in'] for p,v in stats().items()}
    start=time.monotonic()
    for kind in ids: sql(f"UPDATE {kind} SET title='{RUN}measuredchange' WHERE id={ids[kind][50]};")
    changed={kind:returned(kind) for kind in ids}
    for kind in ids: await_synced(kind,[ids[kind][50]])
    elapsed=round(time.monotonic()-start,3)
    pause(5)
    repeat={p:stats()[p]['events']['in']-before[p] for p in before}
    note('MEASUREMENT', fixtureCreated={'job':COUNT,'news':COUNT}, legacyFullSelectWouldReturn=full,
         changedSourceRows={'job':1,'news':1}, incrementalPredicateReturned=changed,
         observedInputEventsIncludingOverlap=repeat, deliveredCurrentPayloadSeconds=elapsed,
         databaseRowsScanned='not measured; returned rows are not scan counts')
    check(changed=={'job':1,'news':1}, 'incremental SELECT returns changed rows instead of whole source tables')


def measure_full_read():
    """별도 전체 대조 읽기. 증분 처리량이나 DB 스캔량 측정으로 합산하지 않는다."""
    for kind in ids:
        begin=time.monotonic()
        rows=op.source_rows(kind)
        elapsed=time.monotonic()-begin
        count=sql(f"SELECT JSON_OBJECT('n',COUNT(*)) FROM {kind};")[0]['n']
        check(len(rows)==count, 'actual full source payload SELECT returned every current row',
              kind=kind, returnedRows=len(rows), tableRowCount=count,
              elapsedSeconds=round(elapsed,4), measurement='separate full reconciliation read, not incremental polling; includes client overhead')

def main():
    global started
    note('RUN '+RUN, fixtureEach=COUNT, testOverlapSeconds=OVERLAP, testPollSeconds=2, fetchSize=50)
    baseline, projects = original_hashes(), project_hashes()
    configure(); started=True
    recreate()
    before_fetch=global_fetches()
    started_at=time.monotonic(); company=create_fixtures()
    for kind in ids: await_synced(kind)
    fetches=global_fetches()-before_fetch
    check(fetches>=6,'same-timestamp 120-row inputs cross 50-row cursor fetch boundaries without omission', cursorFetchCalls=fetches,initialDeliverySeconds=round(time.monotonic()-started_at,3))
    check(all(len({r['changedAt'] for r in op.state_rows(k,ids[k]).values()})==1 for k in ids),'identical UTC timestamps retained across each input fetch boundary')
    repeated_collectors(company)
    for kind in ids:
        extra=",expiration_date='2099-12-31 23:59:59'" if kind=='job' else ''
        sql(f"UPDATE {kind} SET title='{RUN}changed{kind}'{extra} WHERE id={ids[kind][1]};")
        await_synced(kind,[ids[kind][1]]); search_check(kind,ids[kind][1],RUN+'changed'+kind)
    check(op.es_document('job',ids['job'][1])['_source']['expirationDate']=='2099-12-31T23:59:59','title/deadline changes preserve business date response format')
    future_boundary(); delayed_commits(); query_change(); outage(); mapping_fault(); contracts(company); reconciliation(); measurement()
    for kind in ids: await_synced(kind)
    check(original_hashes()==baseline,'all pre-existing job/news source payload hashes unchanged')
    check(project_hashes()==projects,'pre-existing project body/privacy/deletion/views/revision hashes unchanged')
    http('/projects/9002',401); http('/portfolios/list',401)
    _, empty=http('/jobs/search?keyword=absent'+RUN)
    check(empty['data']['content']==[],'healthy zero-result API remains HTTP200 empty')
    check(True,'project private detail and personal-data anonymous policy preserved')
    note('FIXTURES_RETAINED',jobIds=ids['job'],newsIds=ids['news'],companyId=company)
    note('COMPLETE actual incremental scenarios; browser UI and backend/frontend unit tests recorded separately')


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    modes=parser.add_mutually_exclusive_group()
    modes.add_argument('--outage-fixture-run', help='기존 RUN fixture로 미래 timestamp와 PQ 영속 복구 경계만 다시 검증')
    modes.add_argument('--measure-full-read', action='store_true', help='서비스 조작 없이 전체 원본 payload SELECT 반환 행 수/시간만 별도 측정')
    args=parser.parse_args()
    try:
        if args.measure_full_read: measure_full_read()
        elif args.outage_fixture_run: repeat_outage(args.outage_fixture_run)
        else: main()
    except Exception as failure:
        note('FAIL',error=type(failure).__name__,reason=str(failure)[:400])
        raise
    finally:
        for process in transactions:
            try: process.communicate('ROLLBACK;\n',timeout=10)
            except Exception: process.kill()
        if started:
            compose('start','elasticsearch')
            wait(lambda: op.request('GET','/_cluster/health')['status'] in ('yellow','green'),'ES cleanup ready',90)
            for kind,doc_id in injected:
                note('CLEANUP injected tracking state restored from source',kind=kind,id=doc_id)
                op.repair(kind,[doc_id],apply=True)
            compose('up','-d','--no-deps','--force-recreate','logstash')
            ready()
            note('RESTORED ETCH Elasticsearch and Logstash; production overlap=120 seconds / poll=10 seconds; backend worker unchanged')
            for path in sorted(WORK.rglob('*'), reverse=True):
                if path.is_file(): path.unlink()
                elif path.is_dir(): path.rmdir()
            WORK.rmdir()
