#!/usr/bin/env python3
"""격리한 임시 MySQL 스키마에서 채용·뉴스 변경 추적 DDL/수집 SQL을 검증한다.
기존 etch_local 및 Elasticsearch는 변경하지 않는다. 테스트 스키마만 생성/삭제한다.
"""
import ast
import json
from pathlib import Path
import subprocess
import time
import uuid

ROOT = Path(__file__).resolve().parents[1]
SCHEMA = 'etch_sync_schema_' + uuid.uuid4().hex[:10]
MYSQL = ['docker', 'compose', '-f', str(ROOT / 'compose.local.yml'), 'exec', '-T', 'mysql', 'sh', '-c',
         'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql --default-character-set=utf8mb4 -uroot --batch --skip-column-names --raw']


def sql(statement, ok=True):
    result = subprocess.run(MYSQL, input=f'USE `{SCHEMA}`;\n' + statement,
                            text=True, capture_output=True)
    if ok and result.returncode:
        raise AssertionError('isolated SQL failed: ' + result.stderr[-1200:])
    return result


def query(statement):
    result = sql(statement)
    return [json.loads(line) for line in result.stdout.splitlines() if line.strip()]


def state(kind, source_id):
    return query(f"""SELECT JSON_OBJECT('revision',revision,'changedAt',changed_at,'deleted',deleted,
        'payload',payload) FROM search_sync_state WHERE kind='{kind}' AND source_id={source_id};""")[0]


def check(value, label):
    if not value:
        raise AssertionError(label)
    print('PASS ' + label, flush=True)


def extracted_sql(file, function, variable):
    tree = ast.parse((ROOT / 'etch/backend/batch-server' / file).read_text())
    fn = next(item for item in tree.body if isinstance(item, ast.FunctionDef) and item.name == function)
    assignment = next(item for item in fn.body if isinstance(item, ast.Assign)
                      and any(isinstance(target, ast.Name) and target.id == variable for target in item.targets))
    return ast.literal_eval(assignment.value)


def literal(value):
    if value is None:
        return 'NULL'
    if isinstance(value, int):
        return str(value)
    return "'" + value.replace('\\', '\\\\').replace("'", "''") + "'"


def check_repair_lock(kind, source_id, mutation):
    command = MYSQL[:-1] + [MYSQL[-1].replace('mysql --default', 'mysql --unbuffered --default')]
    owner = subprocess.Popen(command, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    writer = None
    try:
        owner.stdin.write(f"USE `{SCHEMA}`; START TRANSACTION; CALL repair_search_state('{kind}',{source_id},0); SELECT JSON_OBJECT('locked',1);\n")
        owner.stdin.flush()
        assert json.loads(owner.stdout.readline()) == {'locked': 1}
        writer = subprocess.Popen(MYSQL, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        writer.stdin.write(f'USE `{SCHEMA}`; {mutation}\n')
        writer.stdin.close()
        writer.stdin = None
        deadline = time.monotonic() + 5
        waiting = False
        while time.monotonic() < deadline:
            locks = query(f"""SELECT JSON_OBJECT('n',COUNT(*)) FROM performance_schema.data_lock_waits w
                JOIN performance_schema.data_locks l ON l.ENGINE_LOCK_ID=w.REQUESTING_ENGINE_LOCK_ID
                WHERE l.OBJECT_SCHEMA='{SCHEMA}' AND l.OBJECT_NAME='{kind}';""")[0]['n']
            if locks:
                waiting = True
                break
            time.sleep(0.05)
        check(waiting, 'repair current-read holds ' + ('source row' if source_id == 101 else 'missing-source gap') + ' lock against concurrent mutation')
    finally:
        owner.communicate('COMMIT;\n', timeout=10)
        assert owner.returncode == 0
        if writer is not None:
            _, errors = writer.communicate(timeout=10)
            assert writer.returncode == 0, errors


def main():
    setup = subprocess.run(MYSQL, input=f'CREATE DATABASE `{SCHEMA}` CHARACTER SET utf8mb4 COLLATE utf8mb4_bin;',
                           text=True, capture_output=True, check=True)
    del setup
    try:
        sql((ROOT / 'local/mysql/001-schema.sql').read_text())
        sql("""INSERT INTO company(id,name,business_no) VALUES(1,'snapshot-company','fixture-business');
            INSERT INTO job(id,title,company_name,region,industry,job_category,work_type,education_level,
                opening_date,expiration_date,company_id,external_job_id)
            VALUES(101,'fixture-job','snapshot-company','서울, 경기','IT','백엔드','정규직','무관',
                '2026-09-01 09:01:02','2099-10-01 18:02:03',1,'phase3-schema-job');
            INSERT INTO news(id,company_id,company_name,title,description,thumbnail_url,url,published_at)
            VALUES(201,1,'snapshot-company','fixture-news','fixture-summary',NULL,'https://example.invalid/schema-news','2026-09-02 12:03:04');""")
        ddl = (ROOT / 'local/mysql/003-job-news-sync.sql').read_text()
        sql(ddl)
        job, news = state('job', 101), state('news', 201)
        check(job['revision'] == news['revision'] == 1, 'bootstrap creates revision=1 for existing source IDs')
        check(job['payload']['openingDate'] == '2026-09-01T09:01:02'
              and news['payload']['publishedAt'] == '2026-09-02T12:03:04', 'business dates preserve wall-clock ISO seconds')
        check(job['payload']['regions'] == '서울, 경기', 'source view keeps raw list for shared transport normalization')
        sql(ddl)
        check(job == state('job', 101) and news == state('news', 201), 'migration rerun preserves payload/revision/changed_at')

        # Execute the actual collectors' SQL without importing modules or external API credentials.
        job_sql = extracted_sql('fetch_job.py', 'save_cleaned_jobs', 'insert_sql')
        params = dict(title='fixture-job', company_name='snapshot-company', region='서울, 경기', industry='IT',
                      job_category='백엔드', work_type='정규직', education_level='무관',
                      opening_date='2026-09-01 09:01:02', expiration_date='2099-10-01 18:02:03',
                      company_id=1, external_job_id='phase3-schema-job')
        sql(job_sql % {key: literal(value) for key, value in params.items()})
        news_sql = extracted_sql('fetch_news.py', '_insert_articles', 'sql')
        values = (1, 'snapshot-company', 'fixture-news', 'fixture-summary', None,
                  'https://example.invalid/schema-news', '2026-09-02 12:03:04')
        sql(news_sql % tuple(map(literal, values)))
        check(job == state('job', 101) and news == state('news', 201), 'actual collector duplicate SQL leaves revisions and timestamps unchanged')
        check(query("SELECT JSON_OBJECT('jobs',(SELECT COUNT(*) FROM job),'news',(SELECT COUNT(*) FROM news));")[0]
              == {'jobs': 1, 'news': 1}, 'external job ID and URL SHA-256 uniqueness retained')
        timestamp = query("SELECT JSON_OBJECT('u',updated_at) FROM job WHERE id=101;")[0]
        sql("UPDATE job SET updated_at='2999-01-01 00:00:00' WHERE id=101;")
        check(job == state('job', 101) and timestamp == query("SELECT JSON_OBJECT('u',updated_at) FROM job WHERE id=101;")[0],
              'supplied future updated_at alone cannot advance tracking')
        sql("SET time_zone='+09:00'; UPDATE job SET title='fixture-job-changed' WHERE id=101;")
        changed = state('job', 101)
        check(changed['revision'] == 2 and changed['payload']['title'] == 'fixture-job-changed', 'source modification and ledger advance together')
        check(query("SELECT JSON_OBJECT('utc',ABS(TIMESTAMPDIFF(SECOND,changed_at,UTC_TIMESTAMP(6)))<=2) FROM search_sync_state WHERE kind='job' AND source_id=101;")[0]['utc'] == 1,
              'changed_at uses UTC even with non-UTC writer session')
        sql("UPDATE job SET opening_date='2026-09-01 09:01:02.999999' WHERE id=101;")
        check(changed == state('job', 101), 'sub-second business date change leaves identical seconds-format search payload unchanged')
        sql("UPDATE company SET name='master-renamed' WHERE id=1;")
        check(changed == state('job', 101) and news == state('news', 201), 'company master rename preserves collector snapshot contract')
        sql("UPDATE job SET company_name='new-snapshot' WHERE id=101;")
        check(state('job', 101)['revision'] == 3, 'changed collected company snapshot increments revision')

        before = state('job', 101)
        sql("START TRANSACTION; UPDATE job SET title='rollback-title' WHERE id=101; ROLLBACK;")
        check(before == state('job', 101), 'source transaction rollback also rolls back ledger mutation')
        sql("CREATE TRIGGER sync_fixture_reject BEFORE INSERT ON search_sync_state FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='ISOLATED_SYNC_REJECT';")
        result = sql("UPDATE job SET title='must-rollback' WHERE id=101;", ok=False)
        sql('DROP TRIGGER sync_fixture_reject;')
        check(result.returncode != 0 and before == state('job', 101)
              and query("SELECT JSON_OBJECT('t',title) FROM job WHERE id=101;")[0]['t'] == 'fixture-job-changed',
              'ledger insert/upsert failure prevents source-only commit')

        sql("DELETE FROM news WHERE id=201;")
        tombstone = state('news', 201)
        check(tombstone['revision'] == 2 and tombstone['deleted'] == 1 and tombstone['payload'] == {'newsId': 201},
              'physical deletion retains next revision and minimal tombstone')
        sql("INSERT INTO news(id,company_id,company_name,title,url,published_at) VALUES(201,1,'new-snapshot','reused-id','https://example.invalid/schema-news','2026-09-02 12:03:04');")
        check(state('news', 201)['revision'] == 3 and state('news', 201)['deleted'] == 0, 'reused source ID continues revision after deletion')
        sql("UPDATE news SET id=202 WHERE id=201;")
        check(state('news', 201)['deleted'] == 1 and state('news', 202)['deleted'] == 0, 'primary key change tombstones old ID and records new ID')

        sql("UPDATE search_sync_state SET changed_at='2999-01-01 00:00:00' WHERE kind='job' AND source_id=101;")
        sql("START TRANSACTION; CALL repair_search_state('job',101,100); COMMIT;")
        repaired = state('job', 101)
        check(repaired['revision'] == 101 and repaired['payload'] == before['payload']
              and not repaired['changedAt'].startswith('2999'), 'repair current-reads source, exceeds ES version floor, restores UTC tracking time')
        sql("START TRANSACTION; CALL repair_search_state('news',999,40); COMMIT;")
        check(state('news', 999)['revision'] == 41 and state('news', 999)['deleted'] == 1,
              'repair missing source produces version-fenced tombstone')
        check_repair_lock('job', 101, "UPDATE job SET title='concurrent-latest' WHERE id=101;")
        check(state('job', 101)['payload']['title'] == 'concurrent-latest',
              'concurrent source update commits after repair and leaves latest payload in ledger')
        check_repair_lock('news', 888, "INSERT INTO news(id,company_id,title,url) VALUES(888,1,'concurrent-created','https://example.invalid/schema-concurrent');")
        check(state('news', 888)['deleted'] == 0 and state('news', 888)['revision'] == 2,
              'concurrent insert after missing-source repair advances tombstone revision')
        for statement in ("CALL repair_search_state('other',101,0);", "CALL repair_search_state('job',101,-1);",
                          "CALL repair_search_state('job',101,9223372036854775807);", "CALL repair_search_state('job',0,0);"):
            check(sql(statement, ok=False).returncode != 0, 'invalid repair argument rejected')
    finally:
        subprocess.run(MYSQL, input=f'DROP DATABASE IF EXISTS `{SCHEMA}`;', text=True, capture_output=True, check=True)


if __name__ == '__main__':
    main()
