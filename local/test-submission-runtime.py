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
mysql_spec=importlib.util.spec_from_file_location('submission_mysql_test',Path(__file__).with_name('project-list-mysql.py'))
mysql=importlib.util.module_from_spec(mysql_spec);mysql_spec.loader.exec_module(mysql)

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

class DependencyCacheIsolationTest(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup)
        self.root=Path(self.tmp.name).resolve();self.state=self.root/'.local/mysql';self.state.mkdir(parents=True)
        self.builder_id='sha256:'+'a'*64
        for key,value in [('ROOT',self.root),('STATE',self.state),('DEPENDENCIES',self.root/'.local/dependencies.json')]:
            p=patch.object(mysql,key,value);p.start();self.addCleanup(p.stop)
        p=patch.object(mysql,'own_guard');p.start();self.addCleanup(p.stop)
        # Any old-volume lookup is prohibited even when a stale local selection opts in.
        p=patch.object(mysql,'resource',side_effect=AssertionError('External resource lookup prohibited'))
        p.start();self.addCleanup(p.stop)

    def docker(self,*args,**kwargs):
        from types import SimpleNamespace
        if args[:2]==('image','inspect'):
            return SimpleNamespace(stdout=self.builder_id+'\n')
        self.assertEqual(args[0],'run')
        mounts=[args[i+1] for i,arg in enumerate(args[:-1]) if arg=='-v']
        self.assertTrue(mounts)
        self.assertTrue(all(mount.startswith(str(self.root)+'/') for mount in mounts))
        self.assertNotIn('/source:ro',' '.join(args))
        self.assertIn('resolveSubmissionDependencies',args)
        return SimpleNamespace(stdout='')

    def test_missing_candidate_cache_resolves_without_private_volume_lookup(self):
        for previous_opt_in in (False,True):
            with self.subTest(previous_opt_in=previous_opt_in):
                if previous_opt_in:
                    mysql.DEPENDENCIES.write_text(json.dumps({'allowExistingDependencyCache':True}))
                with patch.object(mysql,'docker',side_effect=self.docker) as docker:
                    mysql.cache()
                self.assertEqual(docker.call_count,2)
                ready=self.state/'gradle-cache-ready.json'
                self.assertIsNone(json.loads(ready.read_text())['sourceVolume'])
                ready.unlink()

    def test_prepared_candidate_cache_reused_without_mounting_recorded_source(self):
        (self.state/'gradle-cache').mkdir()
        ready=self.state/'gradle-cache-ready.json'
        prior={'builderImageId':self.builder_id,'sourceVolume':'historical-cache-provenance-only'}
        ready.write_text(json.dumps(prior))
        with patch.object(mysql,'docker',side_effect=self.docker) as docker:
            mysql.cache()
        self.assertEqual(docker.call_count,1)
        self.assertEqual(json.loads(ready.read_text()),prior)

    def test_partial_or_wrong_builder_candidate_cache_is_not_replaced(self):
        target=self.state/'gradle-cache';target.mkdir();(target/'preserved').write_text('synthetic')
        with patch.object(mysql,'docker',side_effect=self.docker):
            with self.assertRaises(RuntimeError):mysql.cache()
            (self.state/'gradle-cache-ready.json').write_text(json.dumps({'builderImageId':'different'}))
            with self.assertRaises(RuntimeError):mysql.cache()
        self.assertEqual((target/'preserved').read_text(),'synthetic')

if __name__=='__main__':unittest.main()
