"""Pinned user acceptance guards. Real saved evidence, temporary files, no service IO."""
import contextlib
import copy
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import evaluation_decisions as decisions

spec = importlib.util.spec_from_file_location('accepted_baseline_evaluator', Path(__file__).with_name('evaluate.py'))
evaluator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(evaluator)


class AcceptedBaselineTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        root = evaluator.runtime.ROOT
        cls.approval_bytes = (root / decisions.APPROVAL_PATH).read_bytes()
        cls.approval_template = json.loads(cls.approval_bytes)
        cls.files = {name: (root / name).read_bytes() for name in cls.approval_template['evidenceHashes']}
        for name in ('fresh-v4-public-policy.json', 'fresh-v4-http-contract.json', 'migration-jdbc-regression-v4.json'):
            relative = str(evaluator.PREVIOUS / name)
            cls.files[relative] = (root / relative).read_bytes()

    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name).resolve()
        self.approval = copy.deepcopy(self.approval_template)
        self.approved = json.loads(self.files[self.approval['candidateSummary']])
        self.candidate = self.approved['candidate']
        self.pointer = decisions.request_activation(self.candidate, self.approval)
        self.active = self.root / decisions.ACTIVE_PATH
        self.approval_file = self.root / decisions.APPROVAL_PATH
        for name, data in {**self.files, decisions.APPROVAL_PATH: self.approval_bytes}.items():
            target = self.root / name
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(data)
        self.root_patch = patch.object(evaluator.runtime, 'ROOT', self.root)
        self.root_patch.start()
        self.addCleanup(self.root_patch.stop)

    def git_evidence(self, args, **kwargs):
        """Only the two reviewed commits and known fixture files are available."""
        self.assertEqual(args[:4], ['git', '-C', str(self.root), 'show'])
        commit, name = args[4].split(':', 1)
        self.assertIn(commit, (self.approval['reviewedCommit'], evaluator.PREVIOUS_COMMIT))
        return self.files[name]

    def test_exact_user_decision_has_one_deterministic_narrow_pointer(self):
        pointer = decisions.request_activation(copy.deepcopy(self.candidate), copy.deepcopy(self.approval))
        self.assertEqual(pointer, self.pointer)
        self.assertEqual(pointer['candidateId'], self.approval['candidateId'])
        self.assertEqual(pointer['candidateSha256'], decisions.digest(self.candidate))
        self.assertEqual(pointer['scope'], 'SEARCH_EVALUATION_BASELINE_ONLY')
        self.assertTrue(all(value is False for value in pointer['excludedApprovals'].values()))
        self.assertFalse(self.candidate['active'])
        self.assertEqual(self.candidate['approvalStatus'], 'UNAPPROVED')
        self.assertFalse(self.active.exists())

    def test_no_decision_and_self_declared_approval_cannot_activate(self):
        for candidate in (self.candidate, {}, {'approvalStatus': 'APPROVED', 'active': True}):
            with self.subTest(candidate=bool(candidate)), self.assertRaises(PermissionError):
                decisions.request_activation(candidate)
        other = json.loads(self.files['docs/portfolio/evidence/phase8/es947-run2/summary.json'])['candidate']
        with self.assertRaises(PermissionError):
            decisions.request_activation(other, self.approval)
        self.assertFalse(self.active.exists())

    def test_candidate_identity_jar_images_and_frozen_inputs_cannot_change(self):
        for key in self.candidate['engineIdentity']:
            changed = copy.deepcopy(self.candidate)
            changed['engineIdentity'][key] = 'unreviewed'
            with self.subTest(identity=key), self.assertRaises(PermissionError):
                decisions.request_activation(changed, self.approval)
        for section in ('data', 'baselineFiles'):
            for key in self.candidate['frozenHashes'][section]:
                changed = copy.deepcopy(self.candidate)
                changed['frozenHashes'][section][key] = 'unreviewed'
                with self.subTest(section=section, file=key), self.assertRaises(PermissionError):
                    decisions.request_activation(changed, self.approval)
        changed = copy.deepcopy(self.candidate)
        changed['evidence']['rawEngine']['sha256'] = 'different-result'
        with self.assertRaises(PermissionError):
            decisions.request_activation(changed, self.approval)

    def test_damaged_or_broader_decision_is_rejected_before_loading_references(self):
        mutations = (
            lambda a: a.update(candidateSha256='wrong'),
            lambda a: a.update(candidateId='a-different-candidate'),
            lambda a: a.update(reviewedCommit='newer-commit'),
            lambda a: a.update(scope='PUBLIC_RELEASE'),
            lambda a: a['excludedApprovals'].update(securityResidualRisk=True),
            lambda a: a['engineIdentity'].update(elasticsearchVersion='9.4.8'),
            lambda a: a.update(approvedBy={'role': 'supplier'}),
        )
        for mutate in mutations:
            changed = copy.deepcopy(self.approval)
            mutate(changed)
            with self.subTest(decision=changed['candidateId']):
                with self.assertRaises(PermissionError):
                    decisions.request_activation(self.candidate, changed)
                self.approval_file.write_text(json.dumps(changed))
                with patch.object(evaluator.subprocess, 'check_output') as git:
                    with self.assertRaises(PermissionError):evaluator.load_approved_baseline()
                    git.assert_not_called()
        for damaged in (b'{', b'{}', self.approval_bytes + b'\n'):
            self.approval_file.write_bytes(damaged)
            with self.subTest(damaged=damaged[:2]), patch.object(evaluator.subprocess, 'check_output') as git:
                with self.assertRaises(PermissionError):evaluator.load_approved_baseline()
                git.assert_not_called()

    def test_missing_decision_is_not_inferred_from_candidate_flags(self):
        self.approval_file.unlink()
        with patch.object(evaluator.subprocess, 'check_output') as git:
            with self.assertRaises(FileNotFoundError):evaluator.load_approved_baseline()
            git.assert_not_called()
        self.assertFalse(self.active.exists())

    def test_loader_checks_every_original_reference_and_requires_activation_when_requested(self):
        with patch.object(evaluator.subprocess, 'check_output', side_effect=self.git_evidence) as git:
            approval, approved, pointer = evaluator.load_approved_baseline()
            self.assertEqual(approval, self.approval)
            self.assertEqual(approved, self.approved)
            self.assertEqual(pointer, self.pointer)
            self.assertEqual(git.call_count, len(self.approval['evidenceHashes']))
            with self.assertRaisesRegex(PermissionError, 'has not been activated'):
                evaluator.load_approved_baseline(require_active=True)
        self.assertFalse(self.active.exists())

    def test_original_summary_raw_requests_and_other_references_reject_byte_mutation(self):
        with patch.object(evaluator.subprocess, 'check_output', side_effect=self.git_evidence):
            for name in self.approval['evidenceHashes']:
                file = self.root / name
                original = file.read_bytes()
                file.write_bytes(original + b'\n')
                with self.subTest(file=name), self.assertRaisesRegex(ValueError, 'Approved evidence changed'):
                    evaluator.load_approved_baseline()
                file.write_bytes(original)
        self.assertFalse(self.active.exists())

    def test_matching_working_file_hash_is_insufficient_without_reviewed_git_bytes(self):
        def altered_commit(args, **kwargs):
            return self.git_evidence(args, **kwargs) + b'\n'
        with patch.object(evaluator.subprocess, 'check_output', side_effect=altered_commit):
            with self.assertRaisesRegex(ValueError, 'Approved evidence changed'):
                evaluator.load_approved_baseline()
        self.assertFalse(self.active.exists())

    def test_active_pointer_must_exactly_match_the_narrow_decision(self):
        self.active.write_bytes(evaluator.pointer_bytes(self.pointer))
        with patch.object(evaluator.subprocess, 'check_output', side_effect=self.git_evidence):
            evaluator.load_approved_baseline(require_active=True)
            different = {**self.pointer, 'candidateId': 'later-unapproved-run'}
            for data in (b'{', evaluator.pointer_bytes(different), evaluator.pointer_bytes(self.pointer) + b'\n'):
                self.active.write_bytes(data)
                with self.subTest(pointer=data[:20]), self.assertRaises(PermissionError):
                    evaluator.load_approved_baseline(require_active=True)
                self.assertEqual(self.active.read_bytes(), data)

    def test_current_regression_keeps_historical_failure_and_original_candidate_immutable(self):
        before = copy.deepcopy(self.approved)
        regression = decisions.current_baseline_regression(self.approved, self.approved, self.approval)
        self.assertTrue(regression['passed'])
        self.assertFalse(self.approved['historicalComparison']['passed'])
        self.assertEqual(self.approved['historicalComparison']['rankingDifferenceCount'], 2)
        mismatches = [row['queryId'] for row in self.approved['historicalComparison']['queries'] if not row['sameIdsAndOrder']]
        self.assertEqual(mismatches, ['job-02', 'news-02'])
        self.assertEqual(regression['baselineCandidateId'], self.approval['candidateId'])
        self.assertEqual(self.approved, before)

    def test_current_engine_manifest_image_and_input_hash_differences_are_rejected(self):
        changes = (
            lambda a: a['candidate']['engineIdentity'].update(noriVersion='9.4.8'),
            lambda a: a['candidate']['engineIdentity'].update(backendJarSha256='different'),
            lambda a: a['candidate']['frozenHashes']['data'].update({'queries.json': 'changed-labels'}),
            lambda a: a['candidate']['frozenHashes']['baselineFiles'].update({'search.java': 'changed-code'}),
            lambda a: a['manifest']['dataHashes'].update({'corpus.json': 'changed-corpus'}),
            lambda a: a['runningImageIds'].update(backend='different-image'),
        )
        for number, change in enumerate(changes):
            current = copy.deepcopy(self.approved)
            change(current)
            with self.subTest(change=number), self.assertRaises(ValueError):
                decisions.current_baseline_regression(current, self.approved, self.approval)
        self.assertFalse(self.active.exists())

    def test_activation_is_idempotent_and_does_not_change_original_evidence(self):
        checked = {'functionalContracts': {'passed': True}, 'currentBaselineRegression': {'passed': True},
                   'historicalComparison': {'passed': False}}
        evaluator.activate_after_checks(self.pointer, checked)
        first = self.active.read_bytes()
        evaluator.activate_after_checks(self.pointer, checked)
        self.assertEqual(self.active.read_bytes(), first)
        self.assertEqual(json.loads(first), self.pointer)
        for name, data in self.files.items():
            self.assertEqual((self.root / name).read_bytes(), data)

    def test_failed_current_or_functional_checks_never_create_or_update_pointer(self):
        for functional, current in ((False, True), (True, False), (False, False)):
            result = {'functionalContracts': {'passed': functional}, 'currentBaselineRegression': {'passed': current}}
            with self.subTest(functional=functional, current=current), self.assertRaises(ValueError):
                evaluator.activate_after_checks(self.pointer, result)
            self.assertFalse(self.active.exists())
            self.active.write_bytes(evaluator.pointer_bytes(self.pointer))
            before = self.active.read_bytes()
            with self.assertRaises(ValueError):evaluator.activate_after_checks(self.pointer, result)
            self.assertEqual(self.active.read_bytes(), before)
            self.active.unlink()

    def test_other_active_candidate_and_concurrent_creation_are_never_overwritten(self):
        data = evaluator.pointer_bytes({**self.pointer, 'candidateId': 'different'})
        self.active.write_bytes(data)
        passed = {'functionalContracts': {'passed': True}, 'currentBaselineRegression': {'passed': True}}
        with self.assertRaises(PermissionError):evaluator.activate_after_checks(self.pointer, passed)
        self.assertEqual(self.active.read_bytes(), data)
        # A pointer appearing after exists() must still survive the exclusive write.
        with patch.object(Path, 'exists', return_value=False):
            with self.assertRaises(FileExistsError):evaluator.activate_after_checks(self.pointer, passed)
        self.assertEqual(self.active.read_bytes(), data)

    def test_cli_rejects_reference_substitution_before_preparation_or_service_io(self):
        for mode in ('--activate', '--check-current'):
            base = ['evaluate.py', mode, '--evidence-phase', 'phase8', '--engine-evidence', 'observed.json']
            for replacement in (['--candidate-status', 'PROPOSED'], ['--repeat-of', self.approval['candidateSummary']],
                                ['--repeat-engine', self.candidate['evidence']['rawEngine']['file']]):
                with self.subTest(mode=mode, replacement=replacement), patch('sys.argv', base + replacement), \
                     patch.object(evaluator, 'load_approved_baseline') as loader, \
                     patch.object(evaluator.prepare, 'verify_freeze') as freeze, \
                     patch.object(evaluator.ev, 'http') as http, contextlib.redirect_stderr(io.StringIO()):
                    with self.assertRaises(SystemExit) as error:evaluator.main()
                    self.assertEqual(error.exception.code, 2)
                    loader.assert_not_called()
                    freeze.assert_not_called()
                    http.assert_not_called()
        self.assertFalse(self.active.exists())

    def test_cli_invalid_decision_stops_before_data_checks_and_http(self):
        self.approval_file.write_bytes(b'{"approvalStatus":"APPROVED"}')
        for mode in ('--activate', '--check-current'):
            argv = ['evaluate.py', mode, '--evidence-phase', 'phase8', '--engine-evidence', 'observed.json']
            with self.subTest(mode=mode), patch('sys.argv', argv), \
                 patch.object(evaluator.prepare, 'verify_freeze') as freeze, patch.object(evaluator.ev, 'http') as http:
                with self.assertRaises(PermissionError):evaluator.main()
                freeze.assert_not_called()
                http.assert_not_called()
        self.assertFalse(self.active.exists())

    def run_saved_responses(self, label, mode, mutate=None):
        """Exercise actual classification and CLI output; all external IO uses saved evidence."""
        records = [json.loads(row) for row in self.files[self.approval['candidateSummary'].replace('summary.json', 'requests.jsonl')].splitlines()]
        if mutate:mutate(records)
        responses = iter(records)
        def http(path, phase, query_id):
            record = copy.deepcopy(next(responses))
            self.assertEqual((record['request']['path'], record['phase'], record['queryId']), (path, phase, query_id))
            return record
        def command(args, **kwargs):
            if args[0] == 'git':return self.git_evidence(args, **kwargs)
            if args[:3] == ['fake-compose', 'ps', '-q']:return args[3]
            if args[:3] == ['docker', 'inspect', '--format']:
                return self.approved['runningImageIds'][args[-1]]
            self.fail('Unexpected external command: ' + repr(args))
        raw = json.loads(self.files[self.candidate['evidence']['rawEngine']['file']])
        argv = ['evaluate.py', mode, '--evidence-phase', 'phase8', '--label', label,
                '--engine-evidence', self.candidate['evidence']['rawEngine']['file']]
        with patch('sys.argv', argv), patch.object(evaluator.subprocess, 'check_output', side_effect=command), \
             patch.object(evaluator.runtime, 'compose', side_effect=lambda *args: ['fake-compose', *args]), \
             patch.object(evaluator.prepare, 'verify_freeze', return_value=copy.deepcopy(self.approved['manifest'])), \
             patch.object(evaluator.prepare, 'check_corpus', return_value=copy.deepcopy(self.approved['source'])), \
             patch.object(evaluator, 'reconcile', return_value=copy.deepcopy(self.approved['sync'])), \
             patch.object(evaluator, 'engine_identity', return_value=(self.candidate['engineIdentity'], raw['server'], self.candidate['provenance'])), \
             patch.object(evaluator.ev, 'http', side_effect=http) as requests, patch.object(evaluator.time, 'sleep'), \
             contextlib.redirect_stdout(io.StringIO()):
            exit_code = evaluator.main()
        self.assertEqual(requests.call_count, 34)
        result = json.loads((self.root / 'docs/portfolio/evidence/phase8' / label / 'summary.json').read_bytes())
        return exit_code, result

    def test_cli_current_pass_is_separate_from_preserved_historical_fail(self):
        exit_code, result = self.run_saved_responses('activation-fixture', '--activate')
        self.assertEqual(exit_code, 0)
        self.assertTrue(result['functionalContracts']['passed'])
        self.assertTrue(result['currentBaselineRegression']['passed'])
        self.assertFalse(result['historicalComparison']['passed'])
        self.assertEqual(result['historicalComparison']['rankingDifferenceCount'], 2)
        self.assertNotIn('candidate', result)
        self.assertFalse(result['acceptedBaseline']['publicReleaseApproved'])
        self.assertTrue(result['acceptedBaseline']['active'])
        first = self.active.read_bytes()
        exit_code, checked = self.run_saved_responses('current-fixture', '--check-current')
        self.assertEqual(exit_code, 0)
        self.assertTrue(checked['currentBaselineRegression']['passed'])
        self.assertFalse(checked['historicalComparison']['passed'])
        self.assertEqual(self.active.read_bytes(), first)
        self.assertEqual((self.root / self.approval['candidateSummary']).read_bytes(), self.files[self.approval['candidateSummary']])

    def test_cli_changed_response_fails_current_baseline_without_automatic_refresh(self):
        def change_response(records):
            records[0]['response']['data']['content'][0]['title'] += ' changed'
        exit_code, result = self.run_saved_responses('different-response', '--activate', change_response)
        self.assertEqual(exit_code, 1)
        self.assertTrue(result['functionalContracts']['passed'])
        self.assertFalse(result['currentBaselineRegression']['passed'])
        self.assertFalse(result['historicalComparison']['passed'])
        self.assertFalse(self.active.exists())
        self.active.write_bytes(evaluator.pointer_bytes(self.pointer))
        before = self.active.read_bytes()
        exit_code, result = self.run_saved_responses('different-active-response', '--check-current', change_response)
        self.assertEqual(exit_code, 1)
        self.assertFalse(result['currentBaselineRegression']['passed'])
        self.assertEqual(self.active.read_bytes(), before)
        self.assertEqual((self.root / self.approval['candidateSummary']).read_bytes(), self.files[self.approval['candidateSummary']])


if __name__ == '__main__':
    unittest.main()
