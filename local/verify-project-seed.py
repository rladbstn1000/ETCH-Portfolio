#!/usr/bin/env python3
"""별도 임시 MySQL 스키마에서 프로젝트 seed 원자성을 검증한다.

현재 etch_local 데이터와 Elasticsearch는 수정하지 않는다. 검증용 스키마만
무작위 이름으로 생성하며, 검증 종료 시 해당 스키마만 삭제한다.
자격증명은 로컬 MySQL 컨테이너 환경에서 읽고 출력하지 않는다.
"""
from pathlib import Path
import subprocess, uuid, ast
root=Path(__file__).resolve().parents[1]
schema='etch_seed_check_'+uuid.uuid4().hex[:10]
cmd=['docker','compose','-f',str(root/'compose.local.yml'),'exec','-T','mysql','sh','-c',
     'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql --default-character-set=utf8mb4 -uroot --batch --skip-column-names --raw']
def sql(text, ok=True):
    result=subprocess.run(cmd,input=text,text=True,capture_output=True)
    if ok and result.returncode:
        raise AssertionError('isolated MySQL statement failed')
    return result
seed=(root/'local/seed.sql').read_text().replace('USE etch_local;',f'USE `{schema}`;')
def query(statement): return sql(f'USE `{schema}`;'+statement).stdout.strip()
try:
    sql(f'CREATE DATABASE `{schema}` CHARACTER SET utf8mb4 COLLATE utf8mb4_bin; USE `{schema}`;'+
        (root/'local/mysql/001-schema.sql').read_text()+
        (root/'local/mysql/002-project-indexing.sql').read_text())
    sql(seed)
    assert query('SELECT COUNT(*) FROM project_index_outbox;')=='2'
    assert query('SELECT COUNT(*) FROM project_post WHERE search_revision=1;')=='2'
    print('PASS isolated MySQL fresh seed: two projects and two revision=1 outbox rows commit together')
    sql(f'''USE `{schema}`;
        INSERT INTO member(id,nickname,email,phoneNumber,gender,birth,role,isDeleted,refreshToken)
          VALUES(9990,'unrelated','unrelated@example.invalid','unrelated-9990','UNSPECIFIED','2000-01-01','USER',0,'');
        INSERT INTO project_post(id,member_id,title,content,category,is_public,is_deleted,view_count,created_at,search_revision)
          VALUES(9100,9001,'nonseed-preserve','nonseed-body','WEB',1,0,77,NOW(),7),
                (9200,9990,'unrelated-preserve','unrelated-body','WEB',1,0,88,NOW(),5);
        UPDATE member SET nickname='changed-by-user' WHERE id=9001;
    ''')
    sql(seed)
    assert query("SELECT CONCAT(title,':',content,':',view_count,':',search_revision) FROM project_post WHERE id=9100;")=='nonseed-preserve:nonseed-body:77:8'
    assert query('SELECT COUNT(*) FROM project_index_outbox WHERE project_id=9100 AND revision=8;')=='1'
    assert query('SELECT search_revision FROM project_post WHERE id=9200;')=='5'
    assert query('SELECT COUNT(*) FROM project_index_outbox WHERE project_id=9200;')=='0'
    print('PASS repeated seed: changed member nonseed project enqueued, body/counters preserved, unrelated project unchanged')
    sql(f'''USE `{schema}`;
        UPDATE project_post SET title='before-failure' WHERE id=9001;
        UPDATE member SET nickname='before-failure-member' WHERE id=9001;
        CREATE TRIGGER seed_outbox_reject BEFORE INSERT ON project_index_outbox FOR EACH ROW
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='synthetic isolated outbox failure';
    ''')
    before=query('SELECT COUNT(*) FROM project_index_outbox;')
    assert sql(seed,ok=False).returncode!=0
    assert query('SELECT title FROM project_post WHERE id=9001;')=='before-failure'
    assert query('SELECT nickname FROM member WHERE id=9001;')=='before-failure-member'
    assert query('SELECT search_revision FROM project_post WHERE id=9001;')=='2'
    assert query('SELECT COUNT(*) FROM project_index_outbox;')==before
    print('PASS outbox insert fault: seed member/project changes, revision and all outbox inserts roll back')
    ast.parse((root/'local/index-seed.py').read_text())
    subprocess.run(['sh','-n',str(root/'scripts/local-seed.sh')],check=True)
    print('PASS Python AST / shell syntax; no Elasticsearch calls or existing etch_local data mutations during this check')
finally:
    sql(f'DROP DATABASE IF EXISTS `{schema}`;')
    print('CLEANUP only the generated isolated schema removed')
