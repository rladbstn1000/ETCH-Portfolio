#!/usr/bin/env python3
"""2차 실제 MySQL/ES/HTTP 검증. 기존 데이터 유지, 이 실행의 합성 프로젝트만 변경.
제한된 MySQL trigger fault injection 및 실제 backend SIGKILL을 구분해 기록한다.
자동 복구 중 seed/reindex/직접 성공 ack를 사용하지 않는다.
"""
import concurrent.futures
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid

ROOT = Path(__file__).resolve().parents[1]

def module(name, file):
    spec = importlib.util.spec_from_file_location(name, ROOT / 'local' / file)
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result

idx = module('recovery_helpers', 'index-seed.py')
auth = module('auth_helpers', 'verify-auth.py')
BASE, ES = auth.BASE, 'http://localhost:19476'
OWNER, OTHER = auth.token(9001), auth.token(9002)
# Nori splits mixed digit/letter markers. A single alphabetic token keeps each
# fixture group isolated even when the application uses OR match semantics.
RUN = 'recovery' + ''.join(chr(97 + byte % 26) for byte in uuid.uuid4().bytes)
created = []


def check(value, label):
    if not value:
        raise AssertionError(label)
    print('PASS ' + label, flush=True)


def compose(*args, enabled=None):
    env = os.environ.copy()
    if enabled is not None:
        env['APP_PROJECT_INDEXING_ENABLED'] = str(enabled).lower()
    subprocess.run(idx.compose(*args), cwd=ROOT, env=env, check=True, stdout=subprocess.DEVNULL)


def sql(statement, admin=False):
    if not admin:
        return idx.mysql_json(statement)
    result = subprocess.run(idx.compose('exec', '-T', 'mysql', 'sh', '-c',
        'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql --default-character-set=utf8mb4 -uroot "$MYSQL_DATABASE" --batch --skip-column-names --raw'),
        input=statement, text=True, capture_output=True, check=True)
    return [json.loads(row) for row in result.stdout.splitlines() if row.strip()]


def http(path, method='GET', body=None, token=None, multipart=False, expected=200):
    headers = {}
    data = None
    if token:
        headers['Authorization'] = 'Bearer ' + token
    if body is not None:
        data = json.dumps(body, ensure_ascii=False).encode()
        if multipart:
            boundary = 'etch-recovery-fixture'
            headers['Content-Type'] = 'multipart/form-data; boundary=' + boundary
            data = (f'--{boundary}\r\nContent-Disposition: form-data; name="data"; filename="data.json"\r\nContent-Type: application/json\r\n\r\n'.encode()
                    + data + f'\r\n--{boundary}--\r\n'.encode())
        else:
            headers['Content-Type'] = 'application/json'
    try:
        with urllib.request.urlopen(urllib.request.Request(BASE + path, data=data, headers=headers, method=method), timeout=20) as response:
            status, raw = response.status, response.read()
    except urllib.error.HTTPError as response:
        status, raw = response.code, response.read()
    if expected is not None:
        assert status == expected, f'{method} {path.split("?")[0]} expected={expected} actual={status}'
    return status, json.loads(raw) if raw else None


def project_body(title, public=True):
    return {'title': title, 'content': '2차 자동복구 합성 검증 본문', 'projectCategory': 'WEB',
            'isPublic': public, 'techCodeIds': []}


def create(title):
    _, result = http('/projects', 'POST', project_body(title), OWNER, True)
    pid = result['data']
    created.append(pid)
    return pid


def update(pid, title, public=True):
    http(f'/projects/{pid}', 'PUT', project_body(title, public), OWNER, True)


def db(pid):
    return sql(f"""SELECT JSON_OBJECT('id',id,'title',title,'revision',search_revision,'visible',is_public+0,
        'deleted',is_deleted+0,'views',view_count,
        'likes',(SELECT COUNT(*) FROM liked_content WHERE type='PROJECT' AND targetId={pid}))
        FROM project_post WHERE id={pid};""")[0]


def document(pid):
    return idx.request(ES, 'GET', f'/project-v2/_doc/{pid}')


def wait(predicate, label, seconds=150):
    deadline = time.monotonic() + seconds
    last = None
    while time.monotonic() < deadline:
        try:
            if predicate():
                return
        except (OSError, urllib.error.URLError, KeyError, IndexError) as error:
            last = type(error).__name__
        time.sleep(0.4)
    raise AssertionError(f'timeout: {label}; last={last}')


def backend_ready():
    wait(lambda: http('/jobs/9001', expected=None)[0] == 200, 'backend DB API ready', 80)


def synced(pid, title=None, visible=True):
    state = db(pid)
    source = document(pid)['_source']
    return (source.get('searchRevision') == state['revision'] and source.get('visible') is visible
            and (title is None or source.get('title') == title))


def search(keyword, page=0, size=10, unified=False):
    path = '/search' if unified else '/projects/search'
    _, result = http(path + '?' + urllib.parse.urlencode({'keyword': keyword, 'page': page, 'size': size}))
    return result['data']['projects'] if unified else result['data']


def check_search(pid, title, keyword):
    wait(lambda: any(row['projectId'] == pid and row['title'] == title for row in search(keyword)['content']), 'actual search matches DB/ES')


def rollback_checks():
    for timing in ('BEFORE', 'AFTER'):
        title = RUN + ' rollback ' + timing
        trigger = 'phase2_rollback_fault'
        sql(f'''DROP TRIGGER IF EXISTS {trigger};
            DELIMITER $$
            CREATE TRIGGER {trigger} {timing} INSERT ON project_index_outbox FOR EACH ROW
            BEGIN
                IF EXISTS(SELECT 1 FROM project_post WHERE id=NEW.project_id AND title='{title}') THEN
                    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='PHASE2_CONTROLLED_ROLLBACK';
                END IF;
            END$$
            DELIMITER ;''', admin=True)
        try:
            status, _ = http('/projects', 'POST', project_body(title), OWNER, True, expected=None)
            check(status >= 500, f'{timing} outbox insert fault → HTTP {status}')
            count = sql(f"SELECT JSON_OBJECT('n',COUNT(*)) FROM project_post WHERE title='{title}';")[0]['n']
            check(count == 0, f'{timing} outbox fault: project creation rolled back')
            # AFTER proves an inserted row and its project are both removed by transaction rollback.
            orphans = sql('''SELECT JSON_OBJECT('n',COUNT(*)) FROM project_index_outbox o
                LEFT JOIN project_post p ON p.id=o.project_id WHERE p.id IS NULL;''')[0]['n']
            check(orphans == 0, f'{timing} outbox fault: no committed orphan work')
        finally:
            sql(f'DROP TRIGGER IF EXISTS {trigger};', admin=True)


def crash_after_write():
    pid = create(RUN + ' ack-before')
    wait(lambda: synced(pid, RUN + ' ack-before'), 'initial ack fixture sync')
    title = RUN + ' ack-after'
    trigger = 'phase2_ack_delay'
    sql(f'''DROP TRIGGER IF EXISTS {trigger};
        DELIMITER $$
            CREATE TRIGGER {trigger} BEFORE UPDATE ON project_index_outbox FOR EACH ROW
        BEGIN
            IF NEW.project_id={pid} AND NEW.status='SUCCEEDED' AND OLD.status <> 'SUCCEEDED' THEN
                DO SLEEP(15);
            END IF;
        END$$
        DELIMITER ;''', admin=True)
    try:
        update(pid, title)
        wait(lambda: synced(pid, title), 'ES write visible before durable ack', 40)
        pending = sql(f"SELECT JSON_OBJECT('n',COUNT(*)) FROM project_index_outbox WHERE project_id={pid} AND status <> 'SUCCEEDED';")[0]['n']
        check(pending > 0, 'fault injection: ES success while outbox success ack still blocked')
        compose('kill', '-s', 'SIGKILL', 'backend')
        print('ACTION actual backend SIGKILL after ES write / delayed DB ack', flush=True)
    finally:
        # DROP waits for the bounded trigger statement to finish; killed DB client rolls its statement back.
        sql(f'DROP TRIGGER IF EXISTS {trigger};', admin=True)
        compose('up', '-d', '--no-deps', 'backend')
        backend_ready()
    wait(lambda: sql(f"SELECT JSON_OBJECT('n',COUNT(*)) FROM project_index_outbox WHERE project_id={pid} AND status <> 'SUCCEEDED';")[0]['n'] == 0,
         'unfinished acknowledgement retried')
    check(synced(pid, title), 'ES success-before-ack process interruption: safe duplicate retry')
    check_search(pid, title, RUN)
    return pid


def visibility_checks():
    group = RUN + 'page'
    ids = [create(group + ' ' + name) for name in ('hidden', 'shown', 'deleted')]
    for pid in ids:
        wait(lambda pid=pid: synced(pid), 'page fixture indexed')
    old_source = document(ids[0])['_source']
    compose('up', '-d', '--no-deps', 'backend', enabled=False)
    backend_ready()
    try:
        update(ids[0], group + ' hidden private', False)
        http(f'/projects/{ids[2]}', 'DELETE', token=OWNER)
        check(document(ids[0])['_source']['visible'], 'controlled worker pause leaves old public ES document')
        first = search(group, size=1)
        check(first['content'] == [] and first['page']['hasNext'] and first['page']['nextPage'] == 1,
              'private first candidate page: empty public results with next candidate page')
        for page in range(3):
            result = search(group, page=page, size=1)
            check(result['page']['totalElements'] is None and result['page']['totalPages'] is None
                  and result['page']['totalExact'] is False, f'candidate page {page}: honest unknown total')
        for unified in (False, True):
            result = search(group, size=10, unified=unified)
            check([row['projectId'] for row in result['content']] == [ids[1]],
                  f'{"unified" if unified else "project"} search excludes stale private/deleted IDs and all DTO fields')
            raw = json.dumps(result, ensure_ascii=False)
            check(group + ' hidden' not in raw and group + ' deleted' not in raw, 'no hidden title in serialized response')
    finally:
        compose('up', '-d', '--no-deps', 'backend', enabled=True)
        backend_ready()
    for pid in (ids[0], ids[2]):
        wait(lambda pid=pid: synced(pid, visible=False), 'private/deleted tombstone')
        src = document(pid)['_source']
        check(set(src) == {'projectId', 'searchRevision', 'visible'}, 'tombstone removes searchable metadata')
        work_id = sql(f"SELECT JSON_OBJECT('id',MIN(id)) FROM project_index_outbox WHERE project_id={pid};")[0]['id']
        sql(f"UPDATE project_index_outbox SET status='PENDING',next_attempt_at=CURRENT_TIMESTAMP(6) WHERE id={work_id};")
        wait(lambda: sql(f"SELECT JSON_OBJECT('s',status) FROM project_index_outbox WHERE id={work_id};")[0]['s'] == 'SUCCEEDED', 'old work replay')
        check(synced(pid, visible=False), 'old work replay cannot resurrect private/deleted document')
    update(ids[0], group + ' republished', True)
    wait(lambda: synced(ids[0], group + ' republished'), 'private→public transition')
    old_version = old_source['searchRevision']
    try:
        idx.request(ES, 'PUT', f'/project-v2/_doc/{ids[0]}?version_type=external_gte&version={old_version}', old_source)
        raise AssertionError('stale snapshot unexpectedly accepted')
    except urllib.error.HTTPError as error:
        check(error.code == 409, 'deterministic delayed old snapshot rejected by actual ES version fence')
    check(synced(ids[0], group + ' republished'), 'delayed old completion does not overwrite latest public state')
    return ids[1]


def concurrency(pid):
    def edits():
        for suffix in ('alpha', 'beta', 'final'):
            update(pid, RUN + ' ' + suffix)
    def views():
        for _ in range(6):
            http(f'/projects/{pid}')
    def likes():
        http('/likes/projects', 'POST', {'targetId': pid}, OTHER, expected=201)
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        tasks = [pool.submit(fn) for fn in (edits, views, likes)]
        for task in tasks:
            task.result()
    wait(lambda: synced(pid, RUN + ' final'), 'concurrent final revision')
    state, source = db(pid), document(pid)['_source']
    check(source['viewCount'] == state['views'] == 6 and source['likeCount'] == state['likes'] == 1,
          'concurrent body edits/6 views/like: DB and ES title, revision, counters agree')
    check_search(pid, RUN + ' final', RUN)


def main():
    print('RUN', RUN, flush=True)
    baseline = sql("SELECT JSON_OBJECT('id',id,'hash',SHA2(CONCAT_WS(CHAR(9),title,content,is_public,is_deleted,view_count),256)) FROM project_post WHERE id IN (9001,9002) ORDER BY id;")
    rollback_checks()
    compose('stop', 'elasticsearch')
    try:
        pid = create(RUN + ' created-during-outage')
        update(pid, RUN + ' latest-during-outage')
        check(db(pid)['title'] == RUN + ' latest-during-outage', 'ES down create/update DB commit')
        rows = sql(f"SELECT JSON_OBJECT('n',COUNT(*)) FROM project_index_outbox WHERE project_id={pid} AND status <> 'SUCCEEDED';")[0]['n']
        check(rows >= 2, 'ES down: both create/update work persisted in same DB transactions')
        compose('kill', '-s', 'SIGKILL', 'backend')
        compose('up', '-d', '--no-deps', 'backend')
        backend_ready()
        check(sql(f"SELECT JSON_OBJECT('n',COUNT(*)) FROM project_index_outbox WHERE project_id={pid};")[0]['n'] >= 2,
              'actual process restart with ES still down retains work and serves DB APIs')
        code, _ = http('/projects/search?keyword=' + RUN, expected=None)
        check(code == 503, 'ES outage is HTTP503, not successful empty results')
    finally:
        compose('start', 'elasticsearch')
    wait(lambda: synced(pid, RUN + ' latest-during-outage'), 'automatic ES recovery latest state')
    check_search(pid, RUN + ' latest-during-outage', RUN)
    check(True, 'ES restart automatically restores DB/ES/actual search agreement without seed/reindex')
    other = create(RUN + ' concurrent')
    concurrency(other)
    crash_after_write()
    healthy = visibility_checks()
    # Impossible revision is controlled invalid-work injection; retain/retry it while another project proceeds.
    bad = sql(f"""INSERT INTO project_index_outbox(project_id,revision) VALUES({healthy},999999999);
        SELECT JSON_OBJECT('id',LAST_INSERT_ID());""")[0]['id']
    try:
        update(pid, RUN + ' healthy-with-poison')
        wait(lambda: synced(pid, RUN + ' healthy-with-poison'), 'healthy work behind poison')
        wait(lambda: sql(f"SELECT JSON_OBJECT('a',attempts) FROM project_index_outbox WHERE id={bad};")[0]['a'] >= 1, 'invalid work recorded')
        bad_row = sql(f"SELECT JSON_OBJECT('s',status,'a',attempts,'e',last_error,'next',next_attempt_at) FROM project_index_outbox WHERE id={bad};")[0]
        check(bad_row['s'] == 'RETRY' and bad_row['e'] and bad_row['next'], 'invalid work retained with attempts/error/next retry; other project progresses')
    finally:
        sql(f'DELETE FROM project_index_outbox WHERE id={bad};')
    for path in ('/projects/search', '/search'):
        _, result = http(path + '?keyword=doesnotexist' + RUN)
        page = result['data']['projects'] if path == '/search' else result['data']
        check(page['content'] == [], f'{path} normal zero is HTTP200 empty')
    http('/portfolios/list', expected=401)
    http('/projects/9002', expected=401)
    http('/projects/9002', token=OTHER, expected=403)
    http('/projects/' + str(pid), 'PUT', project_body('unauthorized'), OTHER, True, expected=403)
    http('/projects/' + str(pid), 'PUT', project_body('unauthorized'), None, True, expected=401)
    check(True, 'phase1 anonymous/other-user access regression')
    after = sql("SELECT JSON_OBJECT('id',id,'hash',SHA2(CONCAT_WS(CHAR(9),title,content,is_public,is_deleted,view_count),256)) FROM project_post WHERE id IN (9001,9002) ORDER BY id;")
    check(baseline == after, 'existing projects unchanged (content/privacy/deletion/views hashes)')
    print('Fixture project IDs:', ','.join(map(str, created)), flush=True)


if __name__ == '__main__':
    try:
        main()
    finally:
        # Only ETCH services/fault triggers. Preserve all existing data and volumes.
        for name in ('phase2_rollback_fault', 'phase2_ack_delay'):
            try:
                sql('DROP TRIGGER IF EXISTS ' + name + ';', admin=True)
            except Exception:
                pass
        compose('start', 'elasticsearch')
        compose('up', '-d', '--no-deps', 'backend', enabled=True)
