#!/usr/bin/env python3
"""채용·뉴스의 상태/ID별 내용 대조/현재 DB 기준 복구. ES에 문서를 직접 쓰지 않는다."""
import argparse
from datetime import datetime, timezone
import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import uuid
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('sync_helpers', ROOT / 'local/index-seed.py')
h = importlib.util.module_from_spec(spec)
spec.loader.exec_module(h)
ES = h.runtime.ES_URL
INDICES = {'job': 'job-v3', 'news': 'news-v3'}
REPORT = h.runtime.STATE_DIR / 'search-sync-last-compare.json'


def positive(value):
    number = int(value)
    if number < 1 or number > 9223372036854775806:
        raise argparse.ArgumentTypeError('양의 BIGINT 범위의 ID가 필요합니다.')
    return number


def sql(text):
    return h.mysql_json(text)


def request(method, path, data=None):
    return h.request(ES, method, path, data)


def normalized(kind, payload, revision, deleted=False):
    if deleted:
        result = {kind + 'Id': int(payload[kind + 'Id'])}
    else:
        result = dict(payload)
        if kind == 'job':
            for field in ('regions', 'industries', 'jobCategories'):
                value = result.get(field)
                result[field] = [part.strip(' \t\r\n\v\f\0') for part in (value or '').split(',') if part.strip(' \t\r\n\v\f\0')]
    result.update(syncRevision=int(revision), deleted=bool(deleted))
    return result


def digest(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()).hexdigest()


def ensure_indices():
    for kind, index in INDICES.items():
        try:
            request('GET', '/' + index)
        except urllib.error.HTTPError as error:
            if error.code != 404:
                raise
            request('PUT', '/' + index, {
                'settings': json.loads((h.RESOURCES / (kind + '-settings.json')).read_text()),
                'mappings': json.loads((h.RESOURCES / (kind + '-mappings.json')).read_text())})
    print('job-v3/news-v3 mappings ready; document delivery belongs to Logstash')


def source_rows(kind, ids=None):
    scope = ' WHERE source_id IN (' + ','.join(map(str, ids)) + ')' if ids else ''
    return {row['id']: row['payload'] for row in sql(f"SELECT JSON_OBJECT('id',source_id,'payload',payload) FROM {kind}_search_source{scope};")}


def state_rows(kind, ids=None):
    scope = ' AND source_id IN (' + ','.join(map(str, ids)) + ')' if ids else ''
    return {row['id']: row for row in sql(f"""SELECT JSON_OBJECT('id',source_id,'revision',revision,
        'changedAt',DATE_FORMAT(changed_at,'%Y-%m-%dT%H:%i:%s.%fZ'),'future',changed_at>UTC_TIMESTAMP(6),
        'deleted',deleted+0,'payload',payload) FROM search_sync_state WHERE kind='{kind}'{scope};""")}


def es_document(kind, doc_id):
    try:
        return request('GET', f'/{INDICES[kind]}/_doc/{doc_id}')
    except urllib.error.HTTPError as error:
        if error.code == 404:
            return None
        raise


def es_rows(kind, ids=None):
    if ids:
        rows = request('POST', '/' + INDICES[kind] + '/_mget', {'ids': list(ids)})['docs']
        return {int(row['_id']): row for row in rows if row.get('found')}
    # Explicit full reconciliation, O(all documents), separate from incremental polling.
    result = request('POST', '/' + INDICES[kind] + '/_search?scroll=1m', {'size': 500, 'sort': ['_doc'], 'version': True, 'query': {'match_all': {}}})
    documents, scroll_id = {}, result.get('_scroll_id')
    try:
        while result['hits']['hits']:
            for row in result['hits']['hits']:
                documents[int(row['_id'])] = row
            result = request('POST', '/_search/scroll', {'scroll': '1m', 'scroll_id': scroll_id})
            scroll_id = result.get('_scroll_id', scroll_id)
    finally:
        if scroll_id:
            request('DELETE', '/_search/scroll', {'scroll_id': [scroll_id]})
    return documents


def compare(kind, ids=None, save=True):
    sources, states, documents = source_rows(kind, ids), state_rows(kind, ids), es_rows(kind, ids)
    selected = sorted(set(ids or []) | sources.keys() | states.keys() | documents.keys())
    differences = []
    for doc_id in selected:
        original, state, document = sources.get(doc_id), states.get(doc_id), documents.get(doc_id)
        reasons = []
        deleted = original is None
        payload = original if original is not None else {kind + 'Id': doc_id}
        expected = normalized(kind, payload, state['revision'] if state else 0, deleted)
        if state is None:
            reasons.append('missing_tracking')
        else:
            try:
                tracking_matches = bool(state['deleted']) == deleted and normalized(kind, state['payload'], state['revision'], bool(state['deleted'])) == expected
            except (TypeError, ValueError, KeyError, AttributeError):
                tracking_matches = False
            if not tracking_matches:
                reasons.append('tracking_mismatch')
            if state['future']:
                reasons.append('future_tracking_timestamp')
        if document is None:
            reasons.append('missing_document')
        else:
            actual = document['_source']
            if deleted and not actual.get('deleted'):
                reasons.append('deleted_document_left')
            actual_revision = actual.get('syncRevision')
            if type(actual_revision) is not int or actual_revision < 1:
                reasons.append('invalid_document_revision')
            if type(actual_revision) is int and state and actual_revision < state['revision']:
                reasons.append('stale_document')
            if actual != expected:
                reasons.append('content_mismatch')
            if state and document['_version'] != state['revision']:
                reasons.append('version_mismatch')
        if reasons:
            differences.append({'id': doc_id, 'reasons': reasons, 'expectedHash': digest(expected),
                'actualHash': digest(document['_source']) if document else None,
                'dbRevision': state['revision'] if state else None, 'esVersion': document.get('_version') if document else None})
    report = {'checkedAt': datetime.now(timezone.utc).isoformat(), 'kind': kind,
        'scope': 'explicit IDs' if ids else 'FULL source/state/ES comparison (not incremental polling)',
        'sourceCount': len(sources), 'stateCount': len(states), 'esCount': len(documents),
        'checkedIds': len(selected), 'differenceCount': len(differences), 'differences': differences}
    if save:
        REPORT.parent.mkdir(parents=True, exist_ok=True)
        previous = json.loads(REPORT.read_text()) if REPORT.exists() else {}
        if 'kind' in previous: previous = {previous['kind']: previous}
        previous[kind] = report
        REPORT.write_text(json.dumps(previous, ensure_ascii=False, indent=2) + '\n')
    return report


def repair(kind, ids, apply=False):
    # ES reads finish before any source/ledger row lock. The procedure rereads current DB under lock.
    for doc_id in sorted(set(ids)):
        current = es_document(kind, doc_id)
        floor = current['_version'] if current else 0
        if floor >= 9223372036854775807:
            raise ValueError('ES version cannot safely advance')
        if apply:
            sql(f"""SET TRANSACTION ISOLATION LEVEL REPEATABLE READ; START TRANSACTION;
                CALL repair_search_state('{kind}',{doc_id},{floor}); COMMIT;""")
        print(json.dumps({'kind': kind, 'id': doc_id, 'apply': apply, 'observedEsVersion': floor,
                         'delivery': 'current DB state queued for Logstash' if apply else 'dry-run'}, ensure_ascii=False))


def show(kind, ids):
    """원문/자격증명 없이 일치한 ID도 원본·추적·ES 상태를 표시한다."""
    sources, states, documents = source_rows(kind, ids), state_rows(kind, ids), es_rows(kind, ids)
    rows = []
    for doc_id in sorted(set(ids)):
        source, state, document = sources.get(doc_id), states.get(doc_id), documents.get(doc_id)
        expected = normalized(kind, source if source is not None else {kind + 'Id': doc_id},
                              state['revision'] if state else 0, source is None)
        rows.append({'id': doc_id, 'sourcePresent': source is not None,
            'tracking': {key: state[key] for key in ('revision', 'changedAt', 'deleted', 'future')} if state else None,
            'es': {'version': document['_version'], 'revision': document['_source'].get('syncRevision'),
                   'deleted': document['_source'].get('deleted'), 'hash': digest(document['_source'])} if document else None,
            'expectedHash': digest(expected)})
    return {'kind': kind, 'scope': 'explicit IDs; separate reads are not an atomic snapshot', 'ids': rows}


def status():
    print(json.dumps({'tracking': sql("SELECT JSON_OBJECT('kind',kind,'rows',COUNT(*),'deletedRows',SUM(deleted),'latestChangeUTC',MAX(changed_at)) FROM search_sync_state GROUP BY kind;")}, ensure_ascii=False))
    try:
        with urllib.request.urlopen(h.runtime.LOGSTASH_URL + '/_node/stats/pipelines', timeout=5) as response:
            stats = json.load(response)
        for pipeline, values in stats.get('pipelines', {}).items():
            active = isinstance(values.get('events'), dict) and isinstance(values.get('queue'), dict)
            print(json.dumps({'pipeline': pipeline, 'operationalStatsPresent': active,
                             'events': values.get('events'), 'queue': values.get('queue'),
                             'deadLetterQueue': values.get('dead_letter_queue')}, ensure_ascii=False))
    except (OSError, urllib.error.URLError):
        print('Logstash live stats unavailable (service may be stopped).')
    command = ['sh', '-c', 'for kind in jobs news; do f="/usr/share/logstash/data/checkpoints/$kind.yml"; if [ -f "$f" ]; then printf "%s " "$kind"; cat "$f"; fi; done']
    result = subprocess.run(h.compose('exec', '-T', 'logstash', *command), capture_output=True, text=True)
    if result.returncode:
        # Read the same persisted volume with an ephemeral shell, without starting another pipeline.
        result = subprocess.run(h.compose('run', '--rm', '--no-deps', '-T', '--entrypoint', 'sh', 'logstash', *command[1:]), capture_output=True, text=True)
    if result.returncode == 0:
        print('Query-start checkpoints (not ES acknowledgements):\n' + result.stdout.strip())
    else:
        print('Persisted checkpoint read unavailable.')
    if REPORT.exists():
        previous = json.loads(REPORT.read_text())
        if 'kind' in previous: previous = {previous['kind']: previous}
        print('Latest comparisons: ' + json.dumps({kind: {key: value for key, value in result.items() if key != 'differences'} for kind, result in previous.items()}, ensure_ascii=False))


def inspect_dlq(pipeline, seconds=30):
    # A bounded read-only reader. It never commits offsets, cleans entries or sends old JSON to ES.
    name = 'etch-dlq-inspect-' + uuid.uuid4().hex[:10]
    # These are settings-file keys, not all accepted CLI flags in Logstash 8.18.3.
    setup = """mkdir -p /tmp/etch-dlq-settings
cat > /tmp/etch-dlq-settings/logstash.yml <<'SETTINGS'
path.data: /tmp/etch-dlq-reader
path.queue: /tmp/etch-dlq-reader/queue
path.dead_letter_queue: /tmp/etch-dlq-reader/output
queue.type: memory
pipeline.id: dlq-inspect
pipeline.workers: 1
pipeline.ecs_compatibility: disabled
api.enabled: false
log.level: error
SETTINGS
exec /usr/share/logstash/bin/logstash --path.settings /tmp/etch-dlq-settings -f /usr/share/logstash/dlq-inspect.conf
"""
    command = h.compose('run', '--rm', '--no-deps', '-T', '--name', name, '-e', 'DLQ_PIPELINE=' + pipeline,
        '--entrypoint', 'sh', 'logstash', '-c', setup)
    reader_status = 'time window completed'
    try:
        try:
            result = subprocess.run(command, capture_output=True, text=True, timeout=seconds)
            output = result.stdout
            if result.returncode:
                raise RuntimeError('DLQ reader failed (exit ' + str(result.returncode) + ')')
            reader_status = 'reader exited successfully'
        except subprocess.TimeoutExpired as error:
            output = error.stdout or ''
            if isinstance(output, bytes): output = output.decode('utf8', errors='replace')
    finally:
        subprocess.run(['docker', 'rm', '-f', name], capture_output=True)
    entries = []
    for line in output.splitlines():
        if not line.startswith('{'): continue
        try: entry = json.loads(line)
        except json.JSONDecodeError: continue
        if 'sourceId' in entry:
            entries.append({key: entry.get(key) for key in ('kind', 'sourceId', 'revision', 'failure')})
    print(json.dumps({'pipeline': pipeline, 'readWindowSeconds': seconds, 'readerStatus': reader_status, 'entries': entries,
        'note': 'No offsets committed. Empty output alone does not prove DLQ empty; check persisted stats.'}, ensure_ascii=False))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='command', required=True)
    sub.add_parser('init', help='새 versioned index 설정/매핑 준비, 문서는 직접 쓰지 않음')
    sub.add_parser('status')
    dlq = sub.add_parser('dlq', help='DLQ를 읽고 식별자/실패 분류만 출력, 이전 JSON을 재전송하지 않음')
    dlq.add_argument('pipeline', choices=('jobs','news'))
    dlq.add_argument('--seconds', type=int, choices=range(20,61), default=30)
    for command in ('compare', 'repair', 'show'):
        p = sub.add_parser(command)
        p.add_argument('kind', choices=INDICES)
        p.add_argument('ids', type=positive, nargs='*' if command == 'compare' else '+')
        if command == 'repair':
            p.add_argument('--apply', action='store_true')
    args = parser.parse_args()
    if args.command == 'init': ensure_indices()
    elif args.command == 'status': status()
    elif args.command == 'dlq': inspect_dlq(args.pipeline, args.seconds)
    elif args.command == 'show':
        print(json.dumps(show(args.kind, args.ids), ensure_ascii=False, indent=2))
    elif args.command == 'compare':
        print(json.dumps(compare(args.kind, args.ids or None), ensure_ascii=False, indent=2))
    else: repair(args.kind, args.ids, args.apply)


if __name__ == '__main__':
    try:
        main()
    except (OSError, ValueError, KeyError, RuntimeError, subprocess.CalledProcessError) as failure:
        print('검색 동기화 명령 실패: ' + type(failure).__name__, file=sys.stderr)
        raise SystemExit(2)
