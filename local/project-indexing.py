#!/usr/bin/env python3
"""로컬 프로젝트 outbox 조회·재처리·성공 이력 정리. ES 직접 저장 경로는 제공하지 않는다."""
import argparse
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('seed_helpers', ROOT / 'local/index-seed.py')
helpers = importlib.util.module_from_spec(spec)
spec.loader.exec_module(helpers)


def bounded_integer(minimum, maximum):
    def parse(value):
        try:
            number = int(value)
        except (TypeError, ValueError) as error:
            raise argparse.ArgumentTypeError('정수를 입력하세요.') from error
        if not minimum <= number <= maximum:
            raise argparse.ArgumentTypeError(f'{minimum}~{maximum} 범위의 정수를 입력하세요.')
        return number
    return parse


positive_id = bounded_integer(1, 9223372036854775807)


def enqueue(project_ids):
    ids = ','.join(str(positive_id(value)) for value in project_ids)
    if not ids:
        return
    helpers.mysql_json(f'''START TRANSACTION;
        UPDATE project_post SET search_revision=search_revision+1 WHERE id IN ({ids});
        INSERT INTO project_index_outbox(project_id,revision)
            SELECT id,search_revision FROM project_post WHERE id IN ({ids});
        COMMIT;''')


def retention(days=30, batch_size=100, apply=False, project_ids=None, mysql=None):
    """한 DB 세션/트랜잭션에서 보호 조건과 한 배치의 정리 대상을 결정한다.

    SERIALIZABLE의 locking read가 선택 후 삭제 사이 worker/retry/migration의
    변경과 경쟁하지 않게 한다. dry-run도 같은 선택을 실행하고 rollback한다.
    조회/집계 비용은 전체 이력 규모에 비례할 수 있다. 배치는 삭제 수만 제한한다.
    """
    days = bounded_integer(1, 36500)(days)
    batch_size = bounded_integer(1, 1000)(batch_size)
    ids = sorted({positive_id(value) for value in (project_ids or [])})
    scope = 'AND o.project_id IN (' + ','.join(map(str, ids)) + ')' if ids else ''
    eligible = f'''FROM project_index_outbox o
        JOIN retention_protected k ON k.project_id=o.project_id
        LEFT JOIN project_post p ON p.id=o.project_id
        WHERE o.status='SUCCEEDED' AND o.processed_at < @retention_cutoff
          AND o.revision < k.max_success_revision
          AND (p.id IS NULL OR o.revision <> p.search_revision)
          AND (p.id IS NOT NULL OR o.revision < k.max_revision)
          {scope}'''
    finish = '''DELETE o FROM project_index_outbox o
                    JOIN retention_candidates c ON c.id=o.id;
                SELECT JSON_OBJECT('kind','result','applied',TRUE,'deletedCount',ROW_COUNT());
                COMMIT;''' if apply else '''SELECT JSON_OBJECT('kind','result','applied',FALSE,'deletedCount',0);
                ROLLBACK;'''
    statement = f'''SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
        START TRANSACTION;
        SET @retention_cutoff=TIMESTAMPADD(DAY,-{days},CURRENT_TIMESTAMP(6));
        CREATE TEMPORARY TABLE retention_protected AS
          SELECT project_id,MAX(CASE WHEN status='SUCCEEDED' THEN revision END) AS max_success_revision,
                 MAX(revision) AS max_revision
          FROM project_index_outbox GROUP BY project_id;
        CREATE TEMPORARY TABLE retention_candidates (id BIGINT PRIMARY KEY);
        INSERT INTO retention_candidates(id)
          SELECT o.id {eligible} ORDER BY o.processed_at,o.id LIMIT {batch_size};
        SELECT COUNT(*) INTO @retention_eligible_count {eligible};
        SELECT JSON_OBJECT('kind','retention','days',{days},'batchSize',{batch_size},
            'cutoff',@retention_cutoff,'eligibleCount',@retention_eligible_count,
            'selectedCount',(SELECT COUNT(*) FROM retention_candidates),
            'protectedLatestSuccessCount',COALESCE(SUM(o.status='SUCCEEDED' AND o.revision=k.max_success_revision),0),
            'protectedCurrentRevisionCount',COALESCE(SUM(o.revision=p.search_revision),0),
            'protectedMissingSnapshotCount',COALESCE(SUM(p.id IS NULL AND o.revision=k.max_revision),0))
          FROM project_index_outbox o JOIN retention_protected k ON k.project_id=o.project_id
          LEFT JOIN project_post p ON p.id=o.project_id WHERE TRUE {scope};
        SELECT JSON_OBJECT('kind','protectedSample','id',o.id,'projectId',o.project_id,
            'revision',o.revision,'status',o.status,
            'latestSuccess',o.status='SUCCEEDED' AND o.revision=k.max_success_revision,
            'currentDbRevision',COALESCE(o.revision=p.search_revision,FALSE),
            'missingSnapshot',p.id IS NULL AND o.revision=k.max_revision,
            'unfinished',o.status<>'SUCCEEDED',
            'recentOrUnprocessed',o.processed_at IS NULL OR o.processed_at>=@retention_cutoff)
          FROM project_index_outbox o JOIN retention_protected k ON k.project_id=o.project_id
          LEFT JOIN project_post p ON p.id=o.project_id
          WHERE (o.status<>'SUCCEEDED' OR o.processed_at IS NULL OR o.processed_at>=@retention_cutoff
            OR o.revision=k.max_success_revision OR o.revision=p.search_revision
            OR (p.id IS NULL AND o.revision=k.max_revision)) {scope}
          ORDER BY o.project_id,o.revision DESC LIMIT {batch_size};
        SELECT JSON_OBJECT('kind','candidate','id',o.id,'projectId',o.project_id,
            'revision',o.revision,'processedAt',o.processed_at)
          FROM project_index_outbox o JOIN retention_candidates c ON c.id=o.id
          ORDER BY o.processed_at,o.id;
        {finish}'''
    return (mysql or helpers.mysql_json)(statement)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='command', required=True)
    sub.add_parser('status')
    sub.add_parser('enqueue').add_argument('project_ids', type=positive_id, nargs='+')
    sub.add_parser('retry').add_argument('work_id', type=positive_id)
    cleanup = sub.add_parser('retention', help='성공 이력 보호/정리 대상 확인; 기본 dry-run')
    cleanup.add_argument('--days', type=bounded_integer(1, 36500), default=30, help='보존 일수 (기본 30)')
    cleanup.add_argument('--batch-size', type=bounded_integer(1, 1000), default=100, help='1회 최대 삭제 수 (기본 100, 최대 1000)')
    cleanup.add_argument('--project-id', dest='project_ids', type=positive_id, action='append', help='선택: 지정 프로젝트만 확인/정리, 여러 번 사용 가능')
    cleanup.add_argument('--apply', action='store_true', help='명시했을 때만 실제 삭제')
    args = parser.parse_args()
    if args.command == 'enqueue':
        enqueue(args.project_ids)
        print('로컬 프로젝트의 최신 DB 상태 반영을 outbox에 기록했습니다. worker가 처리합니다.')
    elif args.command == 'retry':
        helpers.mysql_json(f'''UPDATE project_index_outbox SET status='PENDING',next_attempt_at=CURRENT_TIMESTAMP(6),
            processed_at=NULL WHERE id={args.work_id};''')
        print('작업을 재시도 대상으로 설정했습니다. 시도 횟수와 마지막 오류는 보존합니다.')
    elif args.command == 'retention':
        for row in retention(args.days, args.batch_size, args.apply, args.project_ids):
            print(json.dumps(row, ensure_ascii=False))
    else:
        rows = helpers.mysql_json('''SELECT JSON_OBJECT('kind','status','status',status,'count',COUNT(*),
             'oldestCreatedAt',MIN(created_at),'oldestAgeSeconds',MAX(TIMESTAMPDIFF(SECOND,created_at,CURRENT_TIMESTAMP(6))))
            FROM project_index_outbox GROUP BY status;
            SELECT JSON_OBJECT('kind','unfinished','id',id,'projectId',project_id,'revision',revision,'status',status,'attempts',attempts,
             'createdAt',created_at,'ageSeconds',TIMESTAMPDIFF(SECOND,created_at,CURRENT_TIMESTAMP(6)),
             'nextAttemptAt',next_attempt_at,'lastError',last_error,'processedAt',processed_at)
            FROM project_index_outbox WHERE status <> 'SUCCEEDED' ORDER BY created_at,id LIMIT 50;''')
        for row in rows:
            print(json.dumps(row, ensure_ascii=False))


if __name__ == '__main__':
    main()
