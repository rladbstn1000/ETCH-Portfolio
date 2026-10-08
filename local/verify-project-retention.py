#!/usr/bin/env python3
"""3차 A: 임시 스키마의 보존 정책과 새 합성 프로젝트의 실제 DB/ES 재처리를 검증한다.
기존 프로젝트/서비스를 변경·중지하지 않는다. 새 API fixture와 그 이력만 남긴다.
"""
import argparse
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import uuid

ROOT = Path(__file__).resolve().parents[1]


def module(name, file):
    spec = importlib.util.spec_from_file_location(name, ROOT / 'local' / file)
    value = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(value)
    return value


cli = module('retention_cli', 'project-indexing.py')
recovery = module('retention_http', 'verify-project-recovery.py')
checks = 0


def check(value, label):
    global checks
    if not value:
        raise AssertionError(label)
    checks += 1
    print('PASS ' + label, flush=True)


def command(*args):
    result = subprocess.run([sys.executable, str(ROOT / 'local/project-indexing.py'), *map(str, args)],
                            text=True, capture_output=True, check=True)
    return [json.loads(line) for line in result.stdout.splitlines()]


def candidate_ids(rows):
    return [row['id'] for row in rows if row.get('kind') == 'candidate']


def isolated_policy():
    schema = 'etch_retention_check_' + uuid.uuid4().hex[:10]
    cmd = recovery.idx.compose('exec', '-T', 'mysql', 'sh', '-c',
        'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql --default-character-set=utf8mb4 -uroot --batch --skip-column-names --raw')

    def sql(statement):
        result = subprocess.run(cmd, input=f'USE `{schema}`;' + statement, text=True, capture_output=True)
        if result.returncode:
            raise AssertionError('isolated retention SQL failed: ' + ' | '.join(line for line in result.stderr.splitlines() if line.startswith('ERROR ')))
        return [json.loads(line) for line in result.stdout.splitlines() if line.strip()]

    try:
        subprocess.run(cmd, input=f'CREATE DATABASE `{schema}`;', text=True, capture_output=True, check=True)
        sql('''CREATE TABLE project_post(id BIGINT PRIMARY KEY,search_revision BIGINT NOT NULL);
            INSERT INTO project_post VALUES(1,10),(3,10);'''
            + (ROOT / 'local/mysql/002-project-indexing.sql').read_text())
        # Deliberately different ID/processed order: latest success must be revision 12.
        sql('''DELETE FROM project_index_outbox;
            INSERT INTO project_index_outbox(id,project_id,revision,status,processed_at,next_attempt_at) VALUES
              (1,1,12,'SUCCEEDED',NOW()-INTERVAL 100 DAY,NOW()),
              (2,1,10,'SUCCEEDED',NOW()-INTERVAL 100 DAY,NOW()),
              (3,1,6,'RETRY',NULL,NOW()+INTERVAL 10 DAY),
              (4,1,5,'PENDING',NULL,NOW()+INTERVAL 10 DAY),
              (5,1,4,'SUCCEEDED',NOW()-INTERVAL 31 DAY,NOW()),
              (6,1,3,'SUCCEEDED',NULL,NOW()),
              (7,1,2,'SUCCEEDED',NOW()-INTERVAL 1 DAY,NOW()),
              (8,1,1,'SUCCEEDED',NOW()-INTERVAL 40 DAY,NOW()),
              (9,2,6,'RETRY',NULL,NOW()+INTERVAL 10 DAY),
              (10,2,4,'SUCCEEDED',NOW()-INTERVAL 100 DAY,NOW()),
              (11,2,1,'SUCCEEDED',NOW()-INTERVAL 35 DAY,NOW()),
              (12,3,10,'SUCCEEDED',NOW()-INTERVAL 100 DAY,NOW());
            UPDATE project_index_outbox SET created_at=NOW()-INTERVAL 100 DAY WHERE status IN ('PENDING','RETRY');''')
        dry = cli.retention(30, 2, mysql=sql)
        check(candidate_ids(dry) == [8, 11], 'isolated dry-run selects oldest eligible rows, bounded to 2')
        check(sql("SELECT JSON_OBJECT('n',COUNT(*)) FROM project_index_outbox;")[0]['n'] == 12,
              'dry-run changes no rows')
        applied = cli.retention(30, 2, True, mysql=sql)
        check(candidate_ids(applied) == candidate_ids(dry) and applied[-1]['deletedCount'] == 2,
              'dry-run and apply select identical rows while fixtures are unchanged')
        check(candidate_ids(cli.retention(30, 100, True, mysql=sql)) == [5],
              'next batch removes only remaining eligible success')
        check(candidate_ids(cli.retention(30, 100, True, mysql=sql)) == [],
              'repeated cleanup has no eligible rows')
        protected = sql("SELECT JSON_OBJECT('id',id) FROM project_index_outbox ORDER BY id;")
        check([row['id'] for row in protected] == [1, 2, 3, 4, 6, 7, 9, 10, 12],
              'PENDING/RETRY, highest successful revision, DB current revision, recent/null processed success retained')
        check(sql("SELECT JSON_OBJECT('revision',MAX(revision)) FROM project_index_outbox WHERE project_id=2;")[0]['revision'] == 6,
              'missing-project MAX(revision) snapshot safety retained')
        before = sql("SELECT JSON_OBJECT('n',COUNT(*)) FROM project_index_outbox;")
        sql((ROOT / 'local/mysql/002-project-indexing.sql').read_text())
        check(sql("SELECT JSON_OBJECT('n',COUNT(*)) FROM project_index_outbox;") == before and
              sql("SELECT JSON_OBJECT('revision',search_revision) FROM project_post WHERE id=1;")[0]['revision'] == 10,
              'migration rerun after cleanup preserves revision and creates no current-revision duplicate')
        for kwargs in ({'days': 0}, {'days': -1}, {'days': 36501}, {'batch_size': 0}, {'batch_size': 1001}, {'project_ids': [-1]}):
            try:
                cli.retention(mysql=sql, **kwargs)
            except argparse.ArgumentTypeError:
                continue
            raise AssertionError('invalid input accepted')
        check(True, 'invalid retention days/batch/project IDs rejected before DB calls')
    finally:
        subprocess.run(cmd, input=f'DROP DATABASE IF EXISTS `{schema}`;', text=True, capture_output=True, check=True)
        print('CLEANUP generated isolated MySQL schema removed', flush=True)


def real_reprocessing():
    marker = 'retention' + ''.join(chr(97 + byte % 26) for byte in uuid.uuid4().bytes)
    public = recovery.create(marker + ' public original')
    private = recovery.create(marker + ' private original')
    deleted = recovery.create(marker + ' deleted original')
    ids = [public, private, deleted]
    scope = ','.join(map(str, ids))
    for pid in ids:
        recovery.wait(lambda pid=pid: recovery.synced(pid), 'initial real project ES sync')
        recovery.update(pid, marker + ' updated ' + str(pid))
        recovery.wait(lambda pid=pid: recovery.synced(pid), 'second revision sync')
    recovery.update(private, marker + ' hidden', False)
    recovery.http(f'/projects/{deleted}', 'DELETE', token=recovery.OWNER)
    for pid in ids:
        recovery.wait(lambda pid=pid: recovery.synced(pid, visible=pid == public), 'final public/tombstone sync')
    recovery.wait(lambda: recovery.sql(f"SELECT JSON_OBJECT('n',COUNT(*)) FROM project_index_outbox WHERE project_id IN ({scope}) AND status<>'SUCCEEDED';")[0]['n'] == 0,
                  'all fixture work acknowledged')
    original_sources = {pid: recovery.document(pid)['_source'] for pid in ids}
    revisions = {pid: recovery.db(pid)['revision'] for pid in ids}
    recovery.sql(f"UPDATE project_index_outbox SET processed_at=NOW()-INTERVAL 40 DAY WHERE project_id IN ({scope}) AND status='SUCCEEDED';")
    arguments = ['retention', '--days', '30', '--batch-size', '100']
    for pid in ids:
        arguments += ['--project-id', str(pid)]
    dry = command(*arguments)
    applied = command(*arguments, '--apply')
    check(len(candidate_ids(dry)) == 5 and candidate_ids(dry) == candidate_ids(applied),
          'real MySQL CLI dry-run/apply removes identical 5 fixture historical successes')
    check(candidate_ids(command(*arguments, '--apply')) == [], 'real fixture repeated cleanup preserves highest/current successes')
    check(all(recovery.db(pid)['revision'] == revisions[pid] and recovery.document(pid)['_source'] == original_sources[pid] for pid in ids),
          'cleanup changes neither DB revisions nor ES public/tombstone documents')
    for pid in ids:
        work = recovery.sql(f"SELECT JSON_OBJECT('id',id,'attempts',attempts) FROM project_index_outbox WHERE project_id={pid};")[0]
        subprocess.run([sys.executable, str(ROOT / 'local/project-indexing.py'), 'retry', str(work['id'])],
                       text=True, capture_output=True, check=True)
        recovery.wait(lambda pid=pid, work=work: recovery.sql(f"SELECT JSON_OBJECT('status',status,'attempts',attempts) FROM project_index_outbox WHERE id={work['id']};")[0]['status'] == 'SUCCEEDED'
                      and recovery.sql(f"SELECT JSON_OBJECT('attempts',attempts) FROM project_index_outbox WHERE id={work['id']};")[0]['attempts'] > work['attempts'], 'retained success replay')
    check(all(recovery.document(pid)['_source'] == original_sources[pid] for pid in ids),
          'retained work replay succeeds and keeps both private/deleted minimal tombstones')
    new_title = marker + ' latest visible'
    recovery.update(public, new_title)
    recovery.wait(lambda: recovery.synced(public, new_title), 'new change after cleanup')
    recovery.check_search(public, new_title, marker)
    cli.enqueue([private, deleted])
    for pid in (private, deleted):
        recovery.wait(lambda pid=pid: recovery.synced(pid, visible=False), 'new hidden revision after cleanup')
    check(all(set(recovery.document(pid)['_source']) == {'projectId', 'searchRevision', 'visible'} for pid in (private, deleted)),
          'new changes/enqueue after cleanup keep private/deleted tombstones without metadata')
    for unified in (False, True):
        response = recovery.search(marker, unified=unified)
        check([row['projectId'] for row in response['content']] == [public],
              ('unified' if unified else 'project') + ' actual search exposes only current public fixture')
    status = command('status')
    check(any(row.get('kind') == 'status' and 'oldestAgeSeconds' in row for row in status),
          'status exposes state counts and oldest ages')
    print('FIXTURES ' + json.dumps(ids) + ' (new API fixtures only; existing data unchanged)', flush=True)


if __name__ == '__main__':
    isolated_policy()
    real_reprocessing()
    print(f'RESULT {checks} checks passed; no seed, reset, service stop, or direct ES writes', flush=True)
