"""Independent-copy guards: mutated bytes and new artifacts cannot inherit approval."""
import contextlib
import copy
import io
import json
from pathlib import Path
import shutil
import tempfile
import unittest
from unittest.mock import patch

import submission_search as subject


class SubmissionSearchTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.approval = json.loads((subject.ROOT / subject.decisions.APPROVAL_PATH).read_text())
        cls.required = [subject.decisions.APPROVAL_PATH, subject.decisions.ACTIVE_PATH,
                        'local/evaluation/manifest.json', *cls.approval['evidenceHashes'],
                        *cls.approval['frozenHashes']['baselineFiles'],
                        *['local/evaluation/' + f for f in cls.approval['frozenHashes']['data']]]
        cls.records = [json.loads(line) for line in (subject.ROOT / cls.approval['candidateSummary'].replace('summary.json', 'requests.jsonl')).read_text().splitlines()]

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        for name in self.required:
            path = self.root / name
            path.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(subject.ROOT / name, path)

    def test_offline_verification_has_no_git_env_or_service_dependency(self):
        with patch('subprocess.check_output', side_effect=AssertionError('Git prohibited')), \
                patch('subprocess.run', side_effect=AssertionError('services prohibited')), \
                patch.object(subject.socket, 'socket', side_effect=AssertionError('network prohibited')):
            result = subject.verify(self.root)
        self.assertTrue(result['copiedInputsVerified'])
        self.assertFalse(result['historicalGitProvenance']['originalGitObjectsAvailableOrVerifiedHere'])
        self.assertFalse(result['runningArtifactApproval'])
        self.assertFalse(result['activationAllowed'])
        self.assertFalse(result['historicalComparison']['passed'])
        self.assertEqual(result['historicalComparison']['rankingDifferenceCount'], 2)
        self.assertFalse((self.root / '.git').exists())
        self.assertFalse((self.root / '.env').exists())

    def test_missing_damaged_and_broadened_decision_are_rejected(self):
        file = self.root / subject.decisions.APPROVAL_PATH
        modified = copy.deepcopy(self.approval)
        modified['scope'] = 'SOURCE_AND_NEW_ARTIFACT'
        for data in (b'{', b'{}', file.read_bytes() + b'\n', json.dumps(modified).encode()):
            file.write_bytes(data)
            with self.assertRaises(PermissionError):
                subject.verify(self.root)
        file.unlink()
        with self.assertRaises(ValueError):
            subject.verify(self.root)

    def test_every_historical_reference_rejects_byte_mutation(self):
        for name in self.approval['evidenceHashes']:
            file = self.root / name
            original = file.read_bytes()
            file.write_bytes(original + b'\n')
            with self.subTest(path=name), self.assertRaisesRegex(ValueError, 'historical evidence changed'):
                subject.verify(self.root)
            file.write_bytes(original)

    def test_labels_corpus_mapping_and_search_code_cannot_change(self):
        paths = ['local/evaluation/queries.json', 'local/evaluation/corpus.json',
                 'etch/backend/business-server/src/main/resources/es/job-mappings.json',
                 'etch/backend/business-server/src/main/java/com/ssafy/etch/search/service/JobSearchService.java']
        for name in paths:
            file = self.root / name
            original = file.read_bytes()
            file.write_bytes(original + b'\n')
            with self.subTest(path=name), self.assertRaises(ValueError):
                subject.verify(self.root)
            file.write_bytes(original)

    def test_manifest_cannot_relabel_new_hash_as_old_approved_input(self):
        file = self.root / 'local/evaluation/manifest.json'
        manifest = json.loads(file.read_text())
        manifest['dataHashes']['queries.json'] = 'a' * 64
        file.write_text(json.dumps(manifest))
        with self.assertRaisesRegex(ValueError, 'manifest no longer matches'):
            subject.verify(self.root)

    def test_damaged_or_other_active_pointer_is_rejected(self):
        file = self.root / subject.decisions.ACTIVE_PATH
        pointer = json.loads(file.read_text())
        pointer['candidateId'] = 'unapproved'
        for data in (b'{}', json.dumps(pointer).encode()):
            file.write_bytes(data)
            with self.assertRaises(PermissionError):
                subject.verify(self.root)

    def test_symlink_cannot_read_original_checkout_as_evidence(self):
        file = self.root / 'local/evaluation/queries.json'
        file.unlink()
        file.symlink_to(subject.ROOT / 'local/evaluation/queries.json')
        with self.assertRaisesRegex(ValueError, 'external submission file'):
            subject.verify(self.root)

    def test_observation_cannot_follow_external_or_credential_urls(self):
        for origin in ('https://example.org', 'http://example.org:8080', 'http://user:pass@localhost:8080',
                       'http://localhost:8080/path', 'http://localhost:8080?x=1', 'http://localhost'):
            with self.subTest(origin=origin), self.assertRaises(ValueError):
                subject.local_origin(origin)
        self.assertEqual(subject.local_origin('http://127.0.0.1:18476'), 'http://127.0.0.1:18476')

    def test_direct_backend_route_does_not_add_a_reverse_proxy_prefix(self):
        response = unittest.mock.MagicMock()
        response.__enter__.return_value.status = 200
        response.__enter__.return_value.read.return_value = b'{"data": {"content": []}}'
        opener = unittest.mock.Mock()
        opener.open.return_value = response
        with patch.object(subject.urllib.request, 'build_opener', return_value=opener):
            result = subject.get_json('http://127.0.0.1:18476', '/jobs/search?keyword=React', 'relevance', 'job-02')
        self.assertEqual(opener.open.call_args.args[0].full_url, 'http://127.0.0.1:18476/jobs/search?keyword=React')
        self.assertEqual(result['status'], 200)

    def test_identical_new_artifact_results_still_do_not_inherit_engine_approval(self):
        responses = iter(copy.deepcopy(self.records))
        with patch.object(subject, 'get_json', side_effect=lambda *args: next(responses)) as request, \
                patch.object(subject.time, 'sleep'):
            result = subject.observe('http://127.0.0.1:18476')
        self.assertEqual(request.call_count, 34)
        self.assertTrue(result['functionalQueryContracts']['passed'])
        self.assertTrue(result['comparisonWithSavedAcceptedResult']['sameRankingAndNdcg'])
        self.assertIsNone(result['currentApprovedEngineRegression']['passed'])
        self.assertEqual(result['currentApprovedEngineRegression']['status'], 'NOT_EVALUATED_NEW_ARTIFACT')
        self.assertFalse(result['runningArtifactApproval'])
        self.assertFalse(result['activationAllowed'])
        self.assertFalse(result['historicalComparison']['passed'])
        self.assertTrue(result['originalEvidenceUnchanged'])

    def test_changed_live_ranking_is_reported_not_adopted(self):
        records = copy.deepcopy(self.records)
        row = next(row for row in records if row['queryId'] == 'job-02')
        row['response']['data']['content'].reverse()
        responses = iter(records)
        before = (subject.ROOT / subject.decisions.ACTIVE_PATH).read_bytes()
        with patch.object(subject, 'get_json', side_effect=lambda *args: next(responses)), patch.object(subject.time, 'sleep'):
            result = subject.observe('http://127.0.0.1:18476')
        self.assertFalse(result['comparisonWithSavedAcceptedResult']['sameRankingAndNdcg'])
        self.assertFalse(result['activationAllowed'])
        self.assertEqual((subject.ROOT / subject.decisions.ACTIVE_PATH).read_bytes(), before)

    def test_cli_cannot_activate_or_overwrite_historical_evidence(self):
        for args in (['verify', '--activate'], ['verify', '--output', str(subject.ROOT / subject.decisions.ACTIVE_PATH)]):
            with patch('sys.argv', ['submission_search.py', *args]), contextlib.redirect_stderr(io.StringIO()):
                with self.assertRaises(SystemExit) as error:
                    subject.main()
                self.assertEqual(error.exception.code, 2)


if __name__ == '__main__':
    unittest.main()
