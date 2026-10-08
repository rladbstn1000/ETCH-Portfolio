"""Fail-closed evaluation classification and one explicitly accepted baseline."""
import hashlib
import json

APPROVAL_PATH = 'docs/portfolio/evidence/phase8/search-baseline-approval.json'
ACTIVE_PATH = 'docs/portfolio/evidence/phase8/active-search-baseline.json'
# Pins this conversation's narrow user decision, not any caller-provided APPROVED flag.
APPROVAL_SHA256 = '86c218fb8353df68b9280415680550dc67a78ee43b6b182ccfb6288166a0e86d'
APPROVAL_DIGEST = '4a5b8905b6003ba85ed3972876e0a912a85e4c2419448099360703897e62f476'


def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(',', ':'), ensure_ascii=False).encode()).hexdigest()


def indexed(rows, key='queryId'):
    result = {row[key]: row for row in rows}
    if len(result) != len(rows):
        raise ValueError('Duplicate query identifiers')
    return result


def validate_identity(actual, locked):
    required = ('elasticsearchVersion', 'noriVersion', 'clientVersion', 'elasticsearchImageId',
                'backendImageId', 'backendJarSha256', 'imageLockSha256')
    if set(actual) != set(required) or any(not actual.get(k) or actual[k] != locked.get(k) for k in required):
        raise ValueError('Unknown or changed engine identity; separate review required')
    return {**actual, 'fingerprint': digest(actual)}


def raw_comparison(before, after, query_ids):
    if not before.get('completed') or not after.get('completed'):
        raise ValueError('Incomplete raw engine observation')
    if before['queriesSha256'] != after['queriesSha256']:
        raise ValueError('Raw observation query hash differs')
    old, new = indexed(before['queries']), indexed(after['queries'])
    if set(old) != set(new) or set(new) != set(query_ids):
        raise ValueError('Missing or unexpected raw engine queries')
    rows = []
    for qid in query_ids:
        a, b = old[qid], new[qid]
        if a['dsl'] != b['dsl'] or a['kind'] != b['kind']:
            raise ValueError('Raw engine DSL or kind changed: ' + qid)
        old_hits, new_hits = indexed(a['hits'], 'id'), indexed(b['hits'], 'id')
        same_members = set(old_hits) == set(new_hits)
        rows.append({'queryId': qid, 'sameIdsAndOrder': list(old_hits) == list(new_hits),
                     'sameIdSet': same_members,
                     'sameRawScores': all(old_hits[i]['score'] == new_hits[i]['score'] for i in old_hits) if same_members else None,
                     'sameSortValues': all(old_hits[i].get('sort') == new_hits[i].get('sort') for i in old_hits) if same_members else None,
                     'before': a['hits'], 'after': b['hits'],
                     'scoresById': [{'id': docid, 'before': old_hits.get(docid, {}).get('score'),
                                     'after': new_hits.get(docid, {}).get('score')}
                                    for docid in sorted(old_hits.keys() | new_hits.keys())]})
    return rows


def query_contracts(records, queries, corpus):
    observed = indexed([row for row in records if row['phase'] == 'relevance'])
    if set(observed) != {q['id'] for q in queries}:raise ValueError('Missing or unexpected API search query')
    checks = []
    for q in queries:
        record = observed[q['id']]
        data = (record.get('response') or {}).get('data', {})
        content = data.get('content') if isinstance(data, dict) else None
        id_key = 'projectId' if q['kind'] == 'project' else 'id'
        valid = isinstance(content, list) and all(isinstance(row, dict) and type(row.get(id_key)) is int for row in content)
        returned = [row[id_key] for row in content] if valid else []
        allowed = {row['id'] for row in corpus[q['kind'] + ('s' if q['kind'] != 'news' else '')]
                   if not row['deleted'] and (q['kind'] != 'project' or row['isPublic'])}
        forbidden = sorted(set(returned) & set(q['forbiddenIds']))
        invisible = sorted(set(returned) - allowed)
        checks.append({'queryId': q['id'], 'passed': record['status'] == 200 and valid
                       and len(returned) == len(set(returned)) and not forbidden and not invisible,
                       'http200': record['status'] == 200, 'validContentAndIdTypes': valid,
                       'forbiddenReturnedIds': forbidden, 'nonPublicOrDeletedOrUnknownIds': invisible,
                       'duplicateIds': len(returned) != len(set(returned))})
    return checks


def validate_documents(before, after):
    if set(before['indices']) != {'job', 'news', 'project'} or set(after['indices']) != set(before['indices']):
        raise ValueError('Unknown index set')
    for kind, old in before['indices'].items():
        new = after['indices'][kind]
        for key in ('documents', 'mapping', 'analysis'):
            if old[key] != new[key]:
                raise ValueError('Repeated engine source/mapping/token evidence changed: ' + kind + '/' + key)
        def semantic(value):
            if len(value) != 1:
                raise ValueError('Unexpected index settings')
            return {k: v for k, v in next(iter(value.values()))['settings']['index'].items()
                    if k not in ('uuid', 'creation_date', 'version', 'provided_name')}
        if semantic(old['settings']) != semantic(new['settings']):
            raise ValueError('Repeated engine settings changed: ' + kind)


def same_api_responses(before, after):
    def contracts(records):
        rows = {}
        for row in records:
            key = (row['phase'], row['queryId'])
            if key in rows:raise ValueError('Duplicate API request records')
            rows[key] = {k: row[k] for k in ('request', 'status', 'response')}
        if len(rows) != 34:raise ValueError('Exactly 30 search and four unified response records required')
        return rows
    # JSON scalar types and list order matter; only timing measurements are omitted.
    return digest(sorted(contracts(before).items())) == digest(sorted(contracts(after).items()))


def classify(current, reference, current_raw, historical_raw, reference_raw, identity, status,
             historical_api, frozen_queries, calculate_ndcg):
    if status not in ('PROPOSED', 'NEEDS_SEARCH_CHANGE'):
        raise ValueError('Only unapproved review states are allowed')
    rows, old = indexed(current['queries']), indexed(reference['queries'])
    if len(rows) != 30 or set(rows) != set(old):
        raise ValueError('Exactly the same 30 frozen queries are required')
    if current['manifest'] != reference['manifest']:
        raise ValueError('Corpus, query/label, mapping or search-code freeze differs')
    if current['runningImageIds'] != reference['runningImageIds']:
        raise ValueError('Reproducibility reference is a different image configuration')
    for raw in (current_raw, reference_raw):
        if raw['server']['version']['number'] != identity['elasticsearchVersion']:
            raise ValueError('Reproducibility reference is a different engine version')
    validate_documents(reference_raw, current_raw)
    historical_raw_rows = raw_comparison(historical_raw, current_raw, list(rows))
    repeat_raw_rows = raw_comparison(reference_raw, current_raw, list(rows))
    original = indexed(historical_api['queries'])
    labels = {q['id']: {row['id']: row['grade'] for row in q['labels']} for q in frozen_queries}
    historical_hits = indexed(historical_raw['queries'])
    if set(original) != set(rows) or set(labels) != set(rows):
        raise ValueError('Historical API/labels must contain the same 30 frozen queries')
    historical = []
    for qid, row in rows.items():
        before_ids = original[qid]['returnedIds']
        if before_ids != [hit['id'] for hit in historical_hits[qid]['hits']]:
            raise ValueError('Historical API and frozen raw engine IDs differ: ' + qid)
        before_score = calculate_ndcg(before_ids, labels[qid])
        after_score = calculate_ndcg(row['returnedIds'], labels[qid])
        repeat_score = calculate_ndcg(old[qid]['returnedIds'], labels[qid])
        if (original[qid]['ndcgAt5'] != before_score or row['baselineReturnedIds'] != before_ids
                or row['baselineNdcgAt5'] != before_score or row['ndcgAt5'] != after_score
                or old[qid]['ndcgAt5'] != repeat_score):
            raise ValueError('Stored comparison metrics differ from frozen labels/API IDs: ' + qid)
        historical.append({'queryId': qid, 'beforeIds': before_ids, 'afterIds': row['returnedIds'],
                           'beforeNdcgAt5': before_score, 'afterNdcgAt5': after_score,
                           'sameIdsAndOrder': before_ids == row['returnedIds'],
                           'sameNdcgAt5': before_score == after_score})
    for api, raw in ((rows, current_raw), (old, reference_raw)):
        for row in raw['queries']:
            if [hit['id'] for hit in row['hits']] != api[row['queryId']]['returnedIds']:
                raise ValueError('Raw observation does not match actual API order: ' + row['queryId'])
    repeat = [{'queryId': qid, 'sameIdsAndOrder': row['returnedIds'] == old[qid]['returnedIds'],
               'sameNdcgAt5': row['ndcgAt5'] == old[qid]['ndcgAt5'],
               'sameSort': row['sort'] == old[qid]['sort']}
              for qid, row in rows.items()]
    repeated = all(all(row[k] for k in ('sameIdsAndOrder', 'sameNdcgAt5', 'sameSort')) for row in repeat)
    repeated = repeated and all(row['sameRawScores'] is True and row['sameSortValues'] is True
                               and row['sameIdsAndOrder'] for row in repeat_raw_rows)
    repeated = repeated and current['meanByKind'] == reference['meanByKind']
    repeated = repeated and current['unifiedChecks'] == reference['unifiedChecks']
    contracts = current['queryContracts']
    if len(contracts) != 30 or set(indexed(contracts)) != set(rows):raise ValueError('30 independent functional query contracts required')
    functional = current['allChecksPassed'] and current['metricChecks']['passed'] == 6 and all(row['passed'] for row in contracts)
    return {
        'functionalContracts': {'passed': functional,
            'queryContracts': contracts,
            'executedScope': '30 actual API searches, four unified contracts, frozen corpus and DB/ES revision/content/tombstone reconciliation; metric self-checks',
            'otherContracts': 'Authorization, JSON, date and read-only checks require their separately linked evidence; not newly executed by this evaluator.'},
        'historicalComparison': {'passed': all(row['sameIdsAndOrder'] and row['sameNdcgAt5'] for row in historical),
            'queries': historical, 'rawScoreQueries': historical_raw_rows,
            'rankingDifferenceCount': sum(not row['sameIdsAndOrder'] for row in historical),
            'rawScoreDifferenceCount': sum(row['sameRawScores'] is False for row in historical_raw_rows),
            'rawScoreIncomparableQueryCount': sum(row['sameRawScores'] is None for row in historical_raw_rows),
            'scope': 'Original engine comparison is retained; raw score change is diagnostic, not nDCG or blanket functional failure.'},
        'sameEngineReproducibility': {'passed': repeated, 'queries': repeat, 'rawScoreQueries': repeat_raw_rows,
            'scope': 'Exact repeated ID/order, nDCG, raw hits/scores, query DSL, unified contracts and mean metrics under the same locked engine.'},
        'candidate': {'reviewStatus': status if functional and repeated else 'NEEDS_SEARCH_CHANGE',
            'approvalStatus': 'UNAPPROVED', 'active': False, 'qualityAccepted': False,
            'publicReleaseApproved': False, 'engineIdentity': identity,
            'scope': 'Same frozen corpus on a different engine; proposal only, never an approved replacement baseline.'}}


def request_activation(candidate, approval=None):
    if approval is None or digest(approval) != APPROVAL_DIGEST:
        raise PermissionError('Missing, damaged or unrecognized explicit user decision')
    if (digest(candidate) != approval['candidateSha256']
            or candidate['engineIdentity'] != approval['engineIdentity']
            or candidate['frozenHashes'] != approval['frozenHashes']):
        raise PermissionError('User acceptance applies only to the exact PHASE8 candidate')
    return {'schemaVersion': 1, 'status': 'ACTIVE', 'candidateId': approval['candidateId'],
            'summarySha256': approval['summarySha256'], 'candidateSha256': approval['candidateSha256'],
            'approval': {'file': APPROVAL_PATH, 'sha256': APPROVAL_SHA256},
            'engineFingerprint': approval['engineIdentity']['fingerprint'],
            'scope': approval['scope'], 'excludedApprovals': approval['excludedApprovals']}


def current_baseline_regression(result, approved, approval):
    request_activation(approved['candidate'], approval)
    candidate = result['candidate']
    if (candidate['engineIdentity'] != approval['engineIdentity']
            or candidate['frozenHashes'] != approval['frozenHashes']
            or result['manifest'] != approved['manifest']
            or result['runningImageIds'] != approved['runningImageIds']):
        raise ValueError('Current engine, images, corpus, labels, mapping or search code differs from approved baseline')
    return {**result['sameEngineReproducibility'],
            'baselineCandidateId': approval['candidateId'], 'baselineSummarySha256': approval['summarySha256'],
            'approvalStatus': 'APPROVED_BY_USER_FOR_SEARCH_BASELINE_ONLY',
            'scope': 'Compare current observations with the immutable accepted PHASE8 candidate; never replace it with this run.'}
