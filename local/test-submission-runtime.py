"""격리 경계와 환경 변조 거부. Docker/HTTP를 실행하지 않는 도구 단위 검사."""
import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec=importlib.util.spec_from_file_location('submission_runtime_test',Path(__file__).with_name('submission-runtime.py'))
rt=importlib.util.module_from_spec(spec);spec.loader.exec_module(rt)

class IsolationTest(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup)
        self.root=Path(self.tmp.name).resolve();self.state=self.root/'.local/state';self.env=self.root/'.env'
        for key,value in [('ROOT',self.root),('STATE',self.state),('ENV',self.env)]:
            p=patch.object(rt,key,value);p.start();self.addCleanup(p.stop)
    def prepare(self):
        self.state.mkdir(parents=True)
        self.env.write_text('LOCAL_TEST_MARKER=synthetic\n')
        self.info={'project':'etch-submission','root':str(self.root),'envSha256':hashlib.sha256(self.env.read_bytes()).hexdigest()}
        (self.state/'identity.json').write_text(json.dumps(self.info))
    def test_missing_identity_rejected(self):
        with self.assertRaises(ValueError):rt.guard()
    def test_changed_environment_never_selects_original_project(self):
        self.prepare();rt.guard()
        self.env.write_text('ETCH_COMPOSE_PROJECT=etch-local\n')
        with self.assertRaises(ValueError):rt.guard()
    def test_moved_directory_or_other_project_rejected(self):
        self.prepare()
        for key,value in [('project','etch-local'),('root',str(self.root/'elsewhere'))]:
            changed=dict(self.info);changed[key]=value
            (self.state/'identity.json').write_text(json.dumps(changed))
            with self.assertRaises(ValueError):rt.guard()
    def test_environment_symlink_rejected(self):
        self.prepare();raw=self.env.read_bytes();self.env.unlink()
        target=self.root/'other';target.write_bytes(raw);self.env.symlink_to(target)
        with self.assertRaises(ValueError):rt.guard()
    def test_new_init_refuses_existing_scoped_resources_without_writes(self):
        with patch.object(rt,'docker',return_value='etch-submission_mysql-data\n'):
            with self.assertRaises(ValueError):rt.init()
        self.assertFalse(self.env.exists());self.assertFalse(self.state.exists())
    def test_compose_always_uses_explicit_candidate_files_and_project(self):
        self.prepare()
        with patch.object(rt,'docker',return_value='') as docker:
            rt.compose('down','--timeout','30')
        args=docker.call_args.args
        self.assertEqual(args[:5],('compose','--env-file',str(self.env),'-p','etch-submission'))
        self.assertIn(str(self.root/'compose.submission.yml'),args)
        self.assertNotIn('--volumes',args);self.assertNotIn('-v',args)

if __name__=='__main__':unittest.main()
