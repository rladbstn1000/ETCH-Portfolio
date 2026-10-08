#!/usr/bin/env python3
"""로컬 환경의 내용 hash·mount·checkpoint 보존 확인. 원문/비밀값은 저장하지 않는다."""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
import re
import subprocess
from datetime import datetime, timezone
import runtime

spec = importlib.util.spec_from_file_location('environment_helpers', runtime.ROOT / 'local/index-seed.py')
h = importlib.util.module_from_spec(spec)
spec.loader.exec_module(h)


def docker(*args):
    return subprocess.check_output(['docker', *args], text=True)


def snapshot():
    ids = docker('ps', '-aq', '--filter', 'label=com.docker.compose.project=' + runtime.PROJECT).split()
    raw = json.loads(docker('inspect', *ids))
    containers = []
    for c in raw:
        containers.append({'id': c['Id'], 'name': c['Name'], 'service': c['Config']['Labels'].get('com.docker.compose.service'),
            'running': c['State']['Running'], 'imageId': c['Image'],
            'mounts': [{key: m.get(key) for key in ('Type', 'Name', 'Source', 'Destination', 'RW')} for m in c['Mounts']],
            'ports': c['NetworkSettings']['Ports'], 'networks': list(c['NetworkSettings']['Networks'])})
    table_hashes = {}
    for table, order in [('job', 'id'), ('news', 'id'), ('member', 'id'), ('project_post', 'id'),
                         ('project_index_outbox', 'id'), ('search_sync_state', 'kind,source_id')]:
        command = h.compose('exec', '-T', 'mysql', 'sh', '-c',
            'MYSQL_PWD="$MYSQL_PASSWORD" mysql --default-character-set=utf8mb4 -u"$MYSQL_USER" "$MYSQL_DATABASE" --batch --skip-column-names --raw')
        # Hash bytes: news contains binary URL SHA columns, so text decoding is unsafe.
        result = subprocess.run(command, input=f'SELECT * FROM {table} ORDER BY {order};'.encode(), capture_output=True, check=True)
        count = h.mysql_json(f"SELECT JSON_OBJECT('n',COUNT(*)) FROM {table};")[0]['n']
        table_hashes[table] = {'rows': count, 'sha256': hashlib.sha256(result.stdout).hexdigest()}
    es_hashes = {}
    for index in ('job-v3', 'news-v3', 'project-v2'):
        result = h.request(runtime.ES_URL, 'POST', '/' + index + '/_search', {'size': 10000, 'version': True, 'query': {'match_all': {}}})
        hits = result['hits']['hits']
        if len(hits) != result['hits']['total']['value']:
            raise ValueError('snapshot limited to 10000; refusing incomplete index hash')
        docs = sorted([{'id': x['_id'], 'version': x['_version'], 'source': x['_source']} for x in hits], key=lambda x: x['id'])
        es_hashes[index] = {'documents': len(docs), 'sha256': hashlib.sha256(json.dumps(docs, ensure_ascii=False, sort_keys=True).encode()).hexdigest()}
    ls = next(c['id'] for c in containers if c['service'] == 'logstash')
    dlq = docker('exec', ls, 'sh', '-c', 'find /usr/share/logstash/data/dead_letter_queue -type f -exec sha256sum {} \\;')
    cp = docker('exec', ls, 'sh', '-c', 'for f in /usr/share/logstash/data/checkpoints/*.yml; do printf "%s " "$f"; cat "$f"; done')
    checkpoints = {}
    for line in cp.splitlines():
        match = re.search(r'/(jobs|news)\.yml .*?(\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:\.\d+)?)', line)
        if match:
            checkpoints[match[1]] = match[2].replace(' ', 'T')
    return {'project': runtime.PROJECT, 'observedAtUtc': datetime.now(timezone.utc).isoformat(),
            'containers': containers, 'tableHashes': table_hashes, 'esHashes': es_hashes,
            'historicalDlqSha256': dlq.splitlines(), 'checkpointsUtc': checkpoints,
            'checkpointNote': 'Running Logstash normally advances query-start checkpoints; no ES ack is implied.'}


def compare(before, after):
    checks = {}
    checks['projectUnchanged'] = before['project'] == after['project']
    checks['databaseRowsAndBytesUnchanged'] = before['tableHashes'] == after['tableHashes']
    checks['esDocumentsAndVersionsUnchanged'] = before['esHashes'] == after['esHashes']
    old = {c['service']: c for c in before['containers']}
    new = {c['service']: c for c in after['containers']}
    checks['containerIdsAndMountsUnchanged'] = all(
        service in new and c['id'] == new[service]['id'] and sorted(c['mounts'], key=lambda m: m['Destination']) == sorted(new[service]['mounts'], key=lambda m: m['Destination'])
        for service, c in old.items())
    checks['servicesRunning'] = all(new[s]['running'] for s in old)
    checks['historicalDlqBytesPreserved'] = set(before['historicalDlqSha256']) <= set(after['historicalDlqSha256'])
    checks['checkpointsPreservedAndNotRewound'] = len(before['checkpointsUtc']) == 2 and all(
        k in after['checkpointsUtc'] and after['checkpointsUtc'][k] >= v for k, v in before['checkpointsUtc'].items())
    return checks


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--compare', type=Path)
    args = parser.parse_args()
    result = snapshot()
    if args.compare:
        result['preservationChecks'] = compare(json.loads(args.compare.read_text()), result)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'project': runtime.PROJECT, 'saved': str(args.output), 'checks': result.get('preservationChecks')}, ensure_ascii=False))
    if 'preservationChecks' in result and not all(result['preservationChecks'].values()):
        raise SystemExit(1)
