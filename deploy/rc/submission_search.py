#!/usr/bin/env python3
"""독립 제출 사본: 저장 증거/순수 guard 검사와 새 로컬 API 관측. 활성화 기능 없음."""
import argparse
from contextlib import contextmanager
import hashlib
import importlib.util
import json
from pathlib import Path
import socket
import sys
import time
import types
import unittest
from unittest.mock import patch
import urllib.error
import urllib.parse
import urllib.request

import evaluation_decisions as decisions

ROOT = Path(__file__).resolve().parents[2]


def sha(data):
    return hashlib.sha256(data).hexdigest()


def confined(root, name):
    root = root.resolve()
    file = (root / name).resolve()
    if not file.is_relative_to(root) or not file.is_file():
        raise ValueError('Missing or external submission file: ' + name)
    return file


def denied(*args, **kwargs):
    raise RuntimeError('Offline fixture checks cannot access Git, services, credentials or network')


def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


@contextmanager
def offline_modules():
    """Import original pure code without reading any .env or historical runtime.

    The old project name is fixture metadata only. All runtime operations throw;
    tests explicitly provide their own recorded responses and temporary Git mocks.
    """
    old_path = sys.path[:]
    runtime = types.ModuleType('runtime')
    runtime.ROOT = ROOT
    runtime.PHASE = 'phase7'
    runtime.START_COMMIT = '22109569f45055d09b0b0b8c642257eba52bd759'
    runtime.TARGET = 'fresh'
    runtime.PROJECT = 'etch-phase7-fresh-v4'
    runtime.STATE_DIR = ROOT / '.local/submission-search-offline'
    runtime.ENV_FILE = None
    runtime.VALUES = {}
    runtime.API_URL = 'http://127.0.0.1:9/api/v1'
    runtime.ES_URL = 'http://elasticsearch:9200'
    runtime.RESOURCES = ROOT / 'etch/backend/business-server/src/main/resources/es'
    runtime.compose = runtime.request = runtime.mysql_json = denied
    prepare = load('submission_frozen_prepare', ROOT / 'local/evaluation/prepare.py')
    prepare.load_helpers = prepare.seed = prepare.check_corpus = denied
    helpers = types.ModuleType('public_helpers')
    helpers.prepare = prepare
    helpers.sync = types.SimpleNamespace(compare=denied)
    try:
        with patch.dict(sys.modules, {'runtime': runtime, 'prepare': prepare, 'public_helpers': helpers}):
            yield
    finally:
        sys.path[:] = old_path


def metrics():
    with offline_modules():
        return load('submission_pure_evaluator', ROOT / 'local/evaluation/evaluate.py')


def verify(root=ROOT):
    """Check copied bytes against the immutable historical decision; do not activate."""
    approval_bytes = confined(root, decisions.APPROVAL_PATH).read_bytes()
    if sha(approval_bytes) != decisions.APPROVAL_SHA256:
        raise PermissionError('Missing or damaged original approval record')
    approval = json.loads(approval_bytes)
    if decisions.digest(approval) != decisions.APPROVAL_DIGEST:
        raise PermissionError('Unrecognized original approval')
    for name, expected in approval['evidenceHashes'].items():
        if sha(confined(root, name).read_bytes()) != expected:
            raise ValueError('Copied historical evidence changed: ' + name)
    approved = json.loads(confined(root, approval['candidateSummary']).read_bytes())
    pointer = decisions.request_activation(approved['candidate'], approval)
    # Checking this already-recorded pointer grants no permission to write one.
    pointer_bytes = (json.dumps(pointer, ensure_ascii=False, indent=2) + '\n').encode()
    if confined(root, decisions.ACTIVE_PATH).read_bytes() != pointer_bytes:
        raise PermissionError('Copied active pointer does not match the original decision')
    frozen = approval['frozenHashes']
    manifest = json.loads(confined(root, 'local/evaluation/manifest.json').read_bytes())
    if (manifest['dataHashes'] != frozen['data'] or manifest['baselineFileHashes'] != frozen['baselineFiles']
            or manifest['baselineCommit'] != approved['manifest']['baselineCommit']):
        raise ValueError('Frozen manifest no longer matches the accepted historical candidate')
    for name, expected in frozen['data'].items():
        if sha(confined(root, 'local/evaluation/' + name).read_bytes()) != expected:
            raise ValueError('Frozen corpus, query or labels changed: ' + name)
    adjustments = {row['file']: row for row in frozen['reviewedCompatibilityAdjustments']}
    for name, expected in frozen['baselineFiles'].items():
        current = sha(confined(root, name).read_bytes())
        if current == expected:
            continue
        adjustment = adjustments.get(name)
        if not adjustment or adjustment['frozenSha256'] != expected or adjustment['currentSha256'] != current:
            raise ValueError('Frozen mapping or search code changed: ' + name)
    ev = metrics()
    labels = {q['id']: {row['id']: row['grade'] for row in q['labels']} for q in ev.QUERIES}
    if len(approved['queries']) != 30 or set(labels) != {q['queryId'] for q in approved['queries']}:
        raise ValueError('Expected exactly the frozen 30 queries')
    for q in approved['queries']:
        if (ev.ndcg(q['returnedIds'], labels[q['queryId']]) != q['ndcgAt5']
                or ev.ndcg(q['baselineReturnedIds'], labels[q['queryId']]) != q['baselineNdcgAt5']):
            raise ValueError('Saved nDCG does not match frozen labels')
    requests_path = approval['candidateSummary'].replace('summary.json', 'requests.jsonl')
    records = [json.loads(line) for line in confined(root, requests_path).read_text().splitlines()]
    contracts = decisions.query_contracts(records, ev.QUERIES, ev.CORPUS)
    if not all(row['passed'] for row in contracts) or len(records) != 34:
        raise ValueError('Saved query contracts are incomplete')
    differences = [q for q in approved['historicalComparison']['queries'] if not q['sameIdsAndOrder']]
    if approved['historicalComparison']['passed'] or [q['queryId'] for q in differences] != ['job-02', 'news-02']:
        raise ValueError('Historical two-query FAIL was changed')
    return {
        'scope': 'OFFLINE_COPIED_EVIDENCE_AND_INPUT_GUARDS',
        'copiedInputsVerified': True, 'historicalEvidenceFiles': len(approval['evidenceHashes']),
        'frozenSearchAndMappingFiles': len(frozen['baselineFiles']),
        'candidateId': approval['candidateId'], 'candidateSha256': approval['candidateSha256'],
        'originalApprovalSha256': sha(approval_bytes),
        'historicalGitProvenance': {'reviewedCommitInOriginalRepository': approval['reviewedCommit'],
            'originalGitObjectsAvailableOrVerifiedHere': False,
            'basis': 'Copied file bytes match the pinned original decision hashes; original commit presence is not re-proven in this independent repository.'},
        'savedObservationsRecomputed': {'queries': 30, 'requests': len(records), 'metricChecks': ev.metric_checks()},
        'historicalComparison': {'passed': False, 'rankingDifferenceCount': 2, 'differences': differences},
        'runningArtifactApproval': False, 'activationAllowed': False,
        'note': 'Offline evidence checks are not a new HTTP, engine, authorization or deployment run.'}


def offline_tests():
    """Run the two unchanged historical test modules with every external IO denied."""
    with offline_modules(), patch('subprocess.check_output', side_effect=denied), \
            patch('subprocess.run', side_effect=denied), patch.object(socket, 'socket', side_effect=denied):
        modules = [load('submission_' + name, Path(__file__).with_name(name + '.py'))
                   for name in ('test_evaluation_decisions', 'test_baseline_activation')]
        suite = unittest.TestSuite(unittest.defaultTestLoader.loadTestsFromModule(module) for module in modules)
        result = unittest.TextTestRunner(verbosity=1).run(suite)
    return {'passed': result.wasSuccessful(), 'testsRun': result.testsRun,
            'failures': len(result.failures), 'errors': len(result.errors),
            'scope': 'Original guard tests; recorded responses and temporary fixture mocks. No live Git, .env, DB, ES or HTTP.'}


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise ValueError('Search observation refuses redirects')


def local_origin(origin):
    parsed = urllib.parse.urlsplit(origin)
    if (parsed.scheme != 'http' or parsed.hostname not in ('127.0.0.1', 'localhost', '::1')
            or parsed.username or parsed.password or parsed.path or parsed.query or parsed.fragment
            or parsed.port is None):
        raise ValueError('An explicit loopback HTTP origin with a port is required')
    return origin


def get_json(origin, path, phase, query_id):
    request = urllib.request.Request(origin + path, headers={'Accept': 'application/json'})
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}), NoRedirect())
    try:
        with opener.open(request, timeout=20) as response:
            status, body = response.status, response.read()
    except urllib.error.HTTPError as error:
        status, body = error.code, error.read()
    try:
        payload = json.loads(body)
    except ValueError:
        payload = {'parseError': True}
    return {'phase': phase, 'queryId': query_id, 'request': {'method': 'GET', 'path': path},
            'status': status, 'response': payload}


def observe(origin):
    """34 real GETs against an explicitly prepared isolated synthetic submission API.

    A new JAR/image is a new artifact. Even identical responses are diagnostics,
    never an approved-current-engine PASS or permission to replace a baseline.
    """
    origin = local_origin(origin)
    provenance = verify()
    ev = metrics()
    approval = json.loads((ROOT / decisions.APPROVAL_PATH).read_text())
    approved = json.loads((ROOT / approval['candidateSummary']).read_text())
    before = {row['queryId']: row for row in approved['queries']}
    records, results, unified = [], [], []
    for query in ev.QUERIES:
        record = get_json(origin, ev.path_for(query), 'relevance', query['id'])
        records.append(record)
        ranked = ev.ids(record, query['kind']) if record['status'] == 200 else []
        labels = {row['id']: row['grade'] for row in query['labels']}
        score = ev.ndcg(ranked, labels)
        reference = before[query['id']]
        results.append({'queryId': query['id'], 'returnedIds': ranked, 'ndcgAt5': score,
                        'sameIdsAndOrderAsAcceptedResult': ranked == reference['returnedIds'],
                        'sameNdcgAsAcceptedResult': score == reference['ndcgAt5']})
        time.sleep(.07)
    for keyword in ('Spring', 'React', '검색', '"'):
        record = get_json(origin, '/search?' + urllib.parse.urlencode({'keyword': keyword, 'size': 100}),
                          'functional', 'unified-' + keyword)
        records.append(record)
        passed, expected = ev.unified_matches_individual(record, records, keyword)
        unified.append({'queryId': record['queryId'], 'passed': passed, 'expectedIdsByKind': expected})
        time.sleep(.07)
    contracts = decisions.query_contracts(records, ev.QUERIES, ev.CORPUS)
    functional = all(row['passed'] for row in contracts + unified)
    diagnostic = all(row['sameIdsAndOrderAsAcceptedResult'] and row['sameNdcgAsAcceptedResult'] for row in results)
    return {'scope': 'NEW_SUBMISSION_ARTIFACT_READ_ONLY_API_OBSERVATION', 'apiOrigin': origin,
            'functionalQueryContracts': {'passed': functional, 'queries': contracts, 'unified': unified,
                'limit': '30 search and four unified GET contracts only; DB/ES source reconciliation and authorization are separate checks.'},
            'comparisonWithSavedAcceptedResult': {'sameRankingAndNdcg': diagnostic, 'queries': results},
            'currentApprovedEngineRegression': {'status': 'NOT_EVALUATED_NEW_ARTIFACT', 'passed': None},
            'historicalComparison': provenance['historicalComparison'],
            'originalEvidenceUnchanged': verify() == provenance,
            'runningArtifactApproval': False, 'activationAllowed': False,
            'requests': records}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['verify', 'offline-tests', 'observe'])
    parser.add_argument('--api-origin', help='New isolated submission backend loopback origin; observe only')
    parser.add_argument('--output', type=Path, help='Optional new JSON under this copy .local; never overwrites')
    args = parser.parse_args()
    if (args.action == 'observe') != bool(args.api_origin):
        parser.error('Only observe requires --api-origin')
    if args.output:
        target = args.output.resolve()
        if not target.is_relative_to((ROOT / '.local').resolve()):
            parser.error('Output must stay under this submission copy .local')
        if target.exists():
            parser.error('Refusing to overwrite existing evidence')
    result = {'verify': verify, 'offline-tests': offline_tests,
              'observe': lambda: observe(args.api_origin)}[args.action]()
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        with args.output.open('x') as stream:
            stream.write(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    concise = {k: v for k, v in result.items() if k not in ('requests', 'historicalComparison', 'comparisonWithSavedAcceptedResult', 'functionalQueryContracts')}
    if args.action == 'observe':
        concise['functionalQueryContractsPassed'] = result['functionalQueryContracts']['passed']
        concise['sameRankingAndNdcgAsSavedAcceptedResult'] = result['comparisonWithSavedAcceptedResult']['sameRankingAndNdcg']
    print(json.dumps(concise, ensure_ascii=False, indent=2))
    if args.action == 'offline-tests':
        return 0 if result['passed'] else 1
    if args.action == 'observe':
        return 0 if result['functionalQueryContracts']['passed'] and result['comparisonWithSavedAcceptedResult']['sameRankingAndNdcg'] else 1
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
