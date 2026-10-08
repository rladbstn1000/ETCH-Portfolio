#!/usr/bin/env python3
"""3차 변경 후 읽기 전용 프로젝트/검색/권한 회귀 확인. 조회수 증가 상세 API는 호출하지 않는다."""
import importlib.util
from pathlib import Path
import urllib.parse

ROOT = Path(__file__).resolve().parents[1]


def load(name, file):
    spec = importlib.util.spec_from_file_location(name, ROOT / 'local' / file)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


r = load('phase3_http', 'verify-project-recovery.py')
s = load('phase3_sync', 'search-sync.py')


def main():
    projects = r.sql("SELECT JSON_OBJECT('id',id,'title',title,'revision',search_revision,'visible',is_public AND NOT is_deleted) FROM project_post;")
    expected = {row['id'] for row in projects if row['visible']}
    for row in projects:
        document = r.document(row['id'])
        source = document['_source']
        assert source.get('searchRevision') == row['revision']
        assert document['_version'] == row['revision']
        assert source.get('visible') is bool(row['visible'])
        if not row['visible']:
            assert set(source) <= {'projectId', 'searchRevision', 'visible'}
    print('PASS all current project DB/ES revisions, visibility and minimal tombstones:', len(projects))
    for unified in (False, True):
        observed = set()
        for project in projects:
            result = r.search(project['title'], size=200, unified=unified)
            found = {row['projectId'] for row in result['content']}
            assert found <= expected
            if project['visible']:
                assert project['id'] in found
            observed |= found
        assert observed == expected
    print('PASS project-only and unified searches find all public IDs and exclude all private/deleted IDs')
    r.http('/projects/9002', expected=401)
    r.http('/projects/9002', token=r.OTHER, expected=403)
    r.http('/portfolios/list', expected=401)
    r.http('/portfolios/9001', token=r.OTHER, expected=403)
    r.http('/portfolios/9001', token=r.OWNER, expected=200)
    print('PASS anonymous/other/owner private-data authorization via actual JWT/filter/application')
    for path in ('/jobs/search', '/news/search', '/projects/search', '/search'):
        r.http(path + '?' + urllib.parse.urlencode({'keyword': '"'}))
    print('PASS quoted keyword returns HTTP200 on all actual search API paths')
    _, result = r.http('/jobs/search?' + urllib.parse.urlencode({'regions': '서울', 'jobCategories': '백엔드', 'size': 200}))
    allowed = {int(doc_id) for doc_id, row in s.es_rows('job').items()
               if not row['_source'].get('deleted') and '서울' in row['_source']['regions']
               and '백엔드' in row['_source']['jobCategories']}
    assert {row['id'] for row in result['data']['content']} == allowed
    print('PASS exact region/category filters match actual indexed live IDs')
    for kind in ('job', 'news'):
        report = s.compare(kind)
        assert report['differenceCount'] == 0
        print('PASS final full DB/state/ES revision and content reconciliation:', kind, report['checkedIds'])
    unfinished = r.sql("SELECT JSON_OBJECT('n',COUNT(*)) FROM project_index_outbox WHERE status<>'SUCCEEDED';")[0]['n']
    assert unfinished == 0
    print('PASS project outbox has no pending/retry work')


if __name__ == '__main__':
    main()
