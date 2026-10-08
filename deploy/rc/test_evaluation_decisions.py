"""Decision guards against the preserved real 30-query evidence; no network or Docker."""
import copy
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import evaluation_decisions as decisions

EVIDENCE = Path(__file__).resolve().parents[2] / 'docs/portfolio/evidence/phase7'
spec = importlib.util.spec_from_file_location('candidate_evaluator', Path(__file__).with_name('evaluate.py'))
evaluator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(evaluator)


class EvaluationDecisionTest(unittest.TestCase):
    def setUp(self):
        read = lambda name: json.loads((EVIDENCE / name).read_text())
        self.reference = read('fresh-v4-evaluation/summary.json')
        self.current = copy.deepcopy(self.reference)
        self.records = [json.loads(line) for line in (EVIDENCE / 'fresh-v4-evaluation/requests.jsonl').read_text().splitlines()]
        data = EVIDENCE.parents[3] / 'local/evaluation'
        self.queries = json.loads((data / 'queries.json').read_text())['queries']
        self.corpus = json.loads((data / 'corpus.json').read_text())
        self.current['queryContracts'] = decisions.query_contracts(self.records, self.queries, self.corpus)
        self.raw = read('engine-fresh-v4-after.json')
        self.reference_raw = copy.deepcopy(self.raw)
        self.historical_raw = read('engine-phase6-before.json')
        self.historical_api = json.loads((EVIDENCE.parent / 'phase6/evaluation-os-final/summary.json').read_text())
        self.identity = {'elasticsearchVersion': '9.4.7', 'noriVersion': '9.4.7', 'clientVersion': '9.4.5',
                         'elasticsearchImageId': self.current['runningImageIds']['elasticsearch'],
                         'backendImageId': self.current['runningImageIds']['backend'],
                         'backendJarSha256': '2eda8d842f08590dfb8c9a0e4521ef19b744a4009efbce5639e16e8ffc304070',
                         'imageLockSha256': 'a' * 64}

    def classify(self):
        return decisions.classify(self.current, self.reference, self.raw, self.historical_raw,
                                  self.reference_raw, self.identity, 'PROPOSED',
                                  self.historical_api, self.queries, evaluator.ev.ndcg)

    def test_real_previous_failures_remain_separate_from_functions_and_reproducibility(self):
        result = self.classify()
        self.assertTrue(result['functionalContracts']['passed'])
        self.assertFalse(result['historicalComparison']['passed'])
        self.assertEqual(result['historicalComparison']['rankingDifferenceCount'], 2)
        self.assertEqual(result['historicalComparison']['rawScoreDifferenceCount'], 29)
        self.assertTrue(result['sameEngineReproducibility']['passed'])
        self.assertEqual(result['candidate']['approvalStatus'], 'UNAPPROVED')
        self.assertFalse(result['candidate']['active'])
        self.assertFalse(result['candidate']['qualityAccepted'])
        self.assertFalse(result['candidate']['publicReleaseApproved'])

    def test_identical_configuration_has_stable_fingerprint(self):
        a = decisions.validate_identity(self.identity, self.identity)
        self.assertEqual(a['fingerprint'], decisions.validate_identity(dict(reversed(list(self.identity.items()))), self.identity)['fingerprint'])

    def test_unknown_version_image_jar_or_missing_identity_is_rejected(self):
        for key in self.identity:
            with self.subTest(key=key):
                changed = {**self.identity, key: 'unknown'}
                with self.assertRaises(ValueError):decisions.validate_identity(changed, self.identity)
                changed.pop(key)
                with self.assertRaises(ValueError):decisions.validate_identity(changed, self.identity)

    def test_unapproved_repeated_ranking_change_is_not_accepted(self):
        row = self.current['queries'][0]
        row['returnedIds'] = list(reversed(row['returnedIds']))
        labels = {item['id']: item['grade'] for item in self.queries[0]['labels']}
        row['ndcgAt5'] = evaluator.ev.ndcg(row['returnedIds'], labels)
        raw = next(q for q in self.raw['queries'] if q['queryId'] == row['queryId'])
        raw['hits'].reverse()
        result = self.classify()
        self.assertFalse(result['sameEngineReproducibility']['passed'])
        self.assertEqual(result['candidate']['reviewStatus'], 'NEEDS_SEARCH_CHANGE')
        self.assertFalse(result['candidate']['active'])

    def test_historical_api_file_mutation_is_rejected_by_frozen_loader(self):
        relative = Path('docs/portfolio/evidence/phase6/evaluation-os-final/summary.json')
        committed = (evaluator.runtime.ROOT / relative).read_bytes()
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory).resolve()
            file = root / relative
            file.parent.mkdir(parents=True)
            file.write_bytes(committed)
            with patch.object(evaluator.runtime, 'ROOT', root), patch.object(evaluator.subprocess, 'check_output', return_value=committed):
                evaluator.evidence(relative, True)
                changed = json.loads(committed)
                row = next(q for q in changed['queries'] if q['queryId'] == 'job-02')
                row['returnedIds'] = [41003, 41014, 41004]
                file.write_text(json.dumps(changed))
                with self.assertRaises(ValueError):evaluator.evidence(relative, True)
                with self.assertRaises(ValueError):evaluator.evidence(file)

    def test_historical_ids_and_scores_cannot_be_forged_to_remove_failure(self):
        row = next(q for q in self.current['queries'] if q['queryId'] == 'job-02')
        row['sameIds'] = row['sameScore'] = True
        self.assertFalse(self.classify()['historicalComparison']['passed'])
        row['baselineReturnedIds'] = row['returnedIds']
        row['baselineNdcgAt5'] = row['ndcgAt5']
        with self.assertRaises(ValueError):self.classify()
        original = next(q for q in self.historical_api['queries'] if q['queryId'] == 'job-02')
        original['returnedIds'] = row['returnedIds']
        original['ndcgAt5'] = row['ndcgAt5']
        with self.assertRaisesRegex(ValueError, 'Historical API and frozen raw'):self.classify()

    def test_ndcg_is_recomputed_from_frozen_labels_not_stored_scores(self):
        for score_rows, key in ((self.current['queries'], 'ndcgAt5'),
                                (self.historical_api['queries'], 'ndcgAt5'),
                                (self.reference['queries'], 'ndcgAt5')):
            row = score_rows[0]
            saved = row[key]
            row[key] = -100
            with self.assertRaises(ValueError):self.classify()
            row[key] = saved

    def test_raw_score_comparison_does_not_conflate_order_sort_or_membership(self):
        before = {'completed': True, 'queriesSha256': 'same', 'queries': [
            {'queryId': 'q', 'kind': 'job', 'dsl': {}, 'hits': [{'id': 1, 'score': 2, 'sort': None}, {'id': 2, 'score': 2, 'sort': None}]}]}
        after = copy.deepcopy(before)
        after['queries'][0]['hits'].reverse()
        row = decisions.raw_comparison(before, after, ['q'])[0]
        self.assertFalse(row['sameIdsAndOrder'])
        self.assertTrue(row['sameRawScores'])
        after['queries'][0]['hits'][0]['sort'] = [100]
        row = decisions.raw_comparison(before, after, ['q'])[0]
        self.assertTrue(row['sameRawScores'])
        self.assertFalse(row['sameSortValues'])
        after['queries'][0]['hits'][0]['id'] = 3
        row = decisions.raw_comparison(before, after, ['q'])[0]
        self.assertIsNone(row['sameRawScores'])

    def test_actual_api_private_deleted_forbidden_and_duplicate_ids_fail_functional_contract(self):
        for leaked in (43023, 43024, 999999):
            changed = copy.deepcopy(self.records)
            record = next(row for row in changed if row['queryId'] == 'project-01')
            record['response']['data']['content'][0]['projectId'] = leaked
            self.current['queryContracts'] = decisions.query_contracts(changed, self.queries, self.corpus)
            with self.subTest(leaked=leaked):
                self.assertFalse(self.classify()['functionalContracts']['passed'])
                self.assertEqual(self.classify()['candidate']['reviewStatus'], 'NEEDS_SEARCH_CHANGE')
        changed = copy.deepcopy(self.records)
        changed[0]['response']['data']['content'].append(changed[0]['response']['data']['content'][0])
        self.assertFalse(decisions.query_contracts(changed, self.queries, self.corpus)[0]['passed'])
        query = copy.deepcopy(self.queries)
        query[0]['forbiddenIds'] = [self.records[0]['response']['data']['content'][0]['id']]
        self.assertFalse(decisions.query_contracts(self.records, query, self.corpus)[0]['passed'])

    def test_activation_is_never_available_even_if_input_claims_approval(self):
        for candidate in ({}, {'approvalStatus': 'APPROVED', 'active': True}):
            with self.assertRaises(PermissionError):decisions.request_activation(candidate)

    def test_changed_labels_mapping_hash_or_search_hash_is_rejected(self):
        original = copy.deepcopy(self.current)
        for section in ('dataHashes', 'baselineFileHashes'):
            for key in self.current['manifest'][section]:
                self.current = copy.deepcopy(original)
                self.current['manifest'][section][key] = 'changed'
                with self.subTest(section=section, key=key), self.assertRaises(ValueError):self.classify()

    def test_unknown_reference_engine_or_image_rejected(self):
        self.reference['runningImageIds']['backend'] = 'unknown'
        with self.assertRaises(ValueError):self.classify()
        self.reference = copy.deepcopy(self.current)
        self.reference_raw['server']['version']['number'] = '9.4.8'
        with self.assertRaises(ValueError):self.classify()

    def test_raw_dsl_and_query_hash_changes_are_rejected(self):
        self.raw['queries'][0]['dsl']['size'] = 6
        with self.assertRaises(ValueError):self.classify()
        self.raw = copy.deepcopy(self.reference_raw)
        self.raw['queriesSha256'] = 'unknown'
        with self.assertRaises(ValueError):self.classify()

    def test_actual_source_mapping_tokens_or_settings_changes_are_rejected(self):
        for key in ('documents', 'mapping', 'analysis', 'settings'):
            self.raw = copy.deepcopy(self.reference_raw)
            if key == 'settings':
                next(iter(self.raw['indices']['job'][key].values()))['settings']['index']['number_of_shards'] = '200'
            else:self.raw['indices']['job'][key] = None
            with self.subTest(key=key), self.assertRaises(ValueError):self.classify()

    def test_incomplete_duplicate_or_raw_api_mismatch_rejected(self):
        self.raw['queries'].pop()
        with self.assertRaises(ValueError):self.classify()
        self.raw = copy.deepcopy(self.reference_raw)
        self.raw['queries'].append(self.raw['queries'][0])
        with self.assertRaises(ValueError):self.classify()
        self.raw = copy.deepcopy(self.reference_raw)
        self.raw['queries'][0]['hits'][0]['id'] = 999999
        with self.assertRaises(ValueError):self.classify()

    def test_response_timing_only_is_ignored_not_json_types_or_order(self):
        rows = [json.loads(line) for line in (EVIDENCE / 'fresh-v4-evaluation/requests.jsonl').read_text().splitlines()]
        changed = copy.deepcopy(rows)
        for row in changed:row['durationMs'] = -1
        self.assertTrue(decisions.same_api_responses(rows, changed))
        changed[0]['status'] = 200.0
        self.assertFalse(decisions.same_api_responses(rows, changed))
        changed = copy.deepcopy(rows)
        changed[0]['response']['data']['content'].reverse()
        self.assertFalse(decisions.same_api_responses(rows, changed))
        with self.assertRaises(ValueError):decisions.same_api_responses(rows, changed[:-1])


if __name__ == '__main__':unittest.main()
