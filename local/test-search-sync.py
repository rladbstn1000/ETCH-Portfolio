"""대조 도구의 손상 revision 방어 테스트. 실제 검색/PQ 검증과 별개다."""
import importlib.util
from pathlib import Path
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('sync_operator_test', Path(__file__).with_name('search-sync.py'))
op = importlib.util.module_from_spec(spec)
spec.loader.exec_module(op)


class CorruptRevisionTest(unittest.TestCase):
    def compare_revision(self, revision):
        source = {'newsId': 17, 'title': 'synthetic'}
        state = {'id': 17, 'payload': source, 'revision': 3, 'deleted': 0, 'future': 0}
        document = {'_version': 3, '_source': dict(source, deleted=False, syncRevision=revision)}
        with patch.object(op, 'source_rows', return_value={17: source}), \
             patch.object(op, 'state_rows', return_value={17: state}), \
             patch.object(op, 'es_rows', return_value={17: document}):
            return op.compare('news', [17], save=False)

    def test_string_null_boolean_and_missing_numeric_revision_are_reported(self):
        for revision in ('3', None, True, 0):
            with self.subTest(revision=revision):
                report = self.compare_revision(revision)
                self.assertEqual(report['differenceCount'], 1)
                self.assertIn('invalid_document_revision', report['differences'][0]['reasons'])

    def test_valid_revision_matches_and_old_revision_is_distinguished(self):
        self.assertEqual(self.compare_revision(3)['differenceCount'], 0)
        self.assertIn('stale_document', self.compare_revision(2)['differences'][0]['reasons'])


if __name__ == '__main__':
    unittest.main()
