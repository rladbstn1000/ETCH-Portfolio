#!/usr/bin/env python3
"""격리 MySQL 목록 검증 환경. 기존 환경 접속/DDL 변경/볼륨 삭제 명령은 없다."""
import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import secrets
import socket
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[1]
STATE = ROOT / '.local/project-list-mysql'
COMPOSE = ROOT / 'local/project-list-mysql.compose.yml'
PROJECT = 'etch-submission-project-list-mysql'
CONTAINER = PROJECT + '-mysql-1'
VOLUME = PROJECT + '-data'
NETWORK = PROJECT + '_default'
SCHEMA = 'etch_project_list'
USER = 'etch_query'
IMAGE = 'sha256:ccbf152841ff331161b37aeb0f77a015e114245038c724a5a252482fd902c07f'
IMAGE_ID = 'sha256:ccbf152841ff331161b37aeb0f77a015e114245038c724a5a252482fd902c07f'
LABEL = 'submission-project-list-mysql-v1'
BUILDER = 'sha256:7be9e75385877e513e1150a37c5b9bb33115d0b4b5681e300c88648ebc859a63'
GRADLE_SOURCE_VOLUME = 'etch-phase7-gradle'
DEPENDENCIES = ROOT / '.local/submission-dependencies.json'
BUILDER_REFERENCE = 'gradle:8.14.4-jdk17-noble@sha256:7be9e75385877e513e1150a37c5b9bb33115d0b4b5681e300c88648ebc859a63'
if DEPENDENCIES.exists():
    dependency_selection = json.loads(DEPENDENCIES.read_text())
    IMAGE = IMAGE_ID = dependency_selection['mysqlImageId']
    BUILDER = dependency_selection['builderImageId']
    for identifier in (IMAGE_ID, BUILDER):
        if not identifier.startswith('sha256:') or len(identifier) != 71 or any(c not in '0123456789abcdef' for c in identifier[7:]):
            raise ValueError('Invalid locally recorded dependency image identity')
DDL = [ROOT / 'local/mysql' / name for name in ('001-schema.sql', '002-project-indexing.sql', '003-job-news-sync.sql')]
STATE_FILE = STATE / 'state.json'


def command(*args, input=None, check=True):
    # Explicit compose scope; inherited credentials/project overrides cannot select an old DB.
    env = {key: value for key, value in os.environ.items() if not key.startswith(('MYSQL_', 'COMPOSE_', 'ETCH_PROJECT_MYSQL_'))}
    result = subprocess.run(args, input=input, text=True, capture_output=True, env=env)
    if check and result.returncode:
        raise RuntimeError('격리 환경 명령 실패. 비밀값/명령 원문은 출력하지 않습니다: ' + str(args[0]))
    return result


def docker(*args, **kwargs):
    return command('docker', *args, **kwargs)


def compose(*args, **kwargs):
    return docker('compose', '--project-name', PROJECT, '--env-file', str(STATE / 'mysql.env'), '-f', str(COMPOSE), *args, **kwargs)


def load_state():
    if not STATE_FILE.is_file():
        raise RuntimeError('먼저 init을 실행하세요. 기존 이름의 자원을 임의로 채택하지 않습니다.')
    state = json.loads(STATE_FILE.read_text())
    if state.get('project') != PROJECT or state.get('schema') != SCHEMA or state.get('imageId') != IMAGE_ID:
        raise RuntimeError('격리 환경 식별자가 일치하지 않습니다.')
    return state


def save_state(state):
    STATE_FILE.write_text(json.dumps(state, ensure_ascii=False, indent=2) + '\n')


def resource(name, identifier):
    result = docker(name, 'inspect', identifier, '--format', '{{json .}}', check=False)
    if result.returncode:
        return None
    # Container inspection is performed only by explicit templates below; this helper
    # is restricted to new network/volume metadata (no environment variables).
    return json.loads(result.stdout)


def container_metadata(name):
    template = '{"id":{{json .Id}},"name":{{json .Name}},"imageId":{{json .Image}},"status":{{json .State.Status}},"startedAt":{{json .State.StartedAt}},"finishedAt":{{json .State.FinishedAt}},"mounts":{{json .Mounts}},"label":{{json (index .Config.Labels "org.etch.validation")}}}'
    result = docker('container', 'inspect', name, '--format', template, check=False)
    if result.returncode != 0:
        return None
    metadata = json.loads(result.stdout)
    metadata['mounts'] = sorted(metadata['mounts'], key=lambda mount: (mount.get('Destination', ''), mount.get('Type', ''), mount.get('Name', ''), mount.get('Source', '')))
    return metadata


def existing_etch():
    names = docker('container', 'ls', '-a', '--filter', 'name=etch', '--format', '{{.Names}}').stdout.splitlines()
    return {name: container_metadata(name) for name in sorted(names) if name != CONTAINER and not name.startswith(PROJECT + '-')}


def local_image_guard():
    endpoint = docker('context', 'inspect', '--format', '{{.Endpoints.docker.Host}}').stdout.strip()
    host = os.environ.get('DOCKER_HOST', endpoint)
    if not host.startswith('unix://'):
        raise RuntimeError('로컬 Unix Docker 데몬에서만 실행합니다.')
    actual = docker('image', 'inspect', IMAGE, '--format', '{{.Id}}').stdout.strip()
    if actual != IMAGE_ID:
        raise RuntimeError('기존 검증 MySQL 이미지 ID가 달라졌습니다. pull/build하지 않고 중지합니다.')


def own_guard(require_container=False):
    state = load_state()
    local_image_guard()
    current = container_metadata(CONTAINER)
    if current:
        volumes = [m for m in current['mounts'] if m.get('Type') == 'volume']
        if current['imageId'] != IMAGE_ID or current['label'] != LABEL or len(volumes) != 1 or volumes[0].get('Name') != VOLUME:
            raise RuntimeError('격리 컨테이너 이미지/label/volume 경계 불일치')
        if state.get('containerId') and current['id'] != state['containerId']:
            raise RuntimeError('기록된 검증 컨테이너와 ID가 다릅니다.')
    elif require_container:
        raise RuntimeError('격리 컨테이너가 없습니다. up을 먼저 실행하세요.')
    for kind, name in [('volume', VOLUME), ('network', NETWORK)]:
        item = resource(kind, name)
        if item and (item.get('Labels') or {}).get('org.etch.validation') != LABEL:
            raise RuntimeError('기존 이름 충돌 자원을 사용하지 않습니다: ' + kind)
    return state, current


def init():
    local_image_guard()
    if STATE_FILE.exists():
        own_guard()
        print('격리 환경 설정이 이미 있습니다. 새 비밀값/기존 데이터 덮어쓰기 없음.')
        return
    if STATE.exists() and any(STATE.iterdir()):
        raise RuntimeError('기존 상태 폴더를 덮어쓰지 않습니다.')
    if container_metadata(CONTAINER) or resource('volume', VOLUME) or resource('network', NETWORK):
        raise RuntimeError('검증 자원 이름이 이미 사용 중입니다. 기존 자원을 채택/삭제하지 않습니다.')
    with socket.socket() as probe:
        try:
            probe.bind(('127.0.0.1', 33087))
        except OSError as error:
            raise RuntimeError('127.0.0.1:33087 포트가 이미 사용 중입니다.') from error
    STATE.mkdir(mode=0o700, parents=True)
    STATE.chmod(0o700)
    password, root_password = secrets.token_hex(32), secrets.token_hex(32)
    options = '?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC&connectTimeout=2000&socketTimeout=15000'
    secret_files = {
        'mysql.env': f'MYSQL_PASSWORD={password}\nMYSQL_ROOT_PASSWORD={root_password}\nETCH_SUBMISSION_MYSQL_IMAGE={IMAGE_ID}\n',
        'test.env': f'ETCH_PROJECT_MYSQL_URL=jdbc:mysql://mysql:3306/{SCHEMA}{options}\nETCH_PROJECT_MYSQL_USER={USER}\nETCH_PROJECT_MYSQL_PASSWORD={password}\n',
        'host-test.env': f'ETCH_PROJECT_MYSQL_URL=jdbc:mysql://127.0.0.1:33087/{SCHEMA}{options}\nETCH_PROJECT_MYSQL_USER={USER}\nETCH_PROJECT_MYSQL_PASSWORD={password}\n',
    }
    for name, text in secret_files.items():
        target = STATE / name
        target.write_text(text)
        target.chmod(0o600)
    before = existing_etch()
    (STATE / 'existing-etch-before.json').write_text(json.dumps(before, ensure_ascii=False, indent=2) + '\n')
    save_state({'project': PROJECT, 'schema': SCHEMA, 'imageId': IMAGE_ID, 'createdAt': datetime.now(timezone.utc).isoformat(), 'schemaInitialized': False, 'containerId': None})
    print('격리 설정 준비: 전용 비밀 파일은 .local/project-list-mysql, 값은 출력하지 않음.')


def sql(query):
    own_guard(require_container=True)
    shell = 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" exec mysql --default-character-set=utf8mb4 -uroot --database=etch_project_list --batch --skip-column-names --raw'
    return compose('exec', '-T', 'mysql', 'sh', '-c', shell, input=query).stdout


def query_json(query):
    return [json.loads(line) for line in sql(query).splitlines() if line.strip()]


def schema():
    state, _ = own_guard(require_container=True)
    hashes = {str(path.relative_to(ROOT)): hashlib.sha256(path.read_bytes()).hexdigest() for path in DDL}
    if state['schemaInitialized']:
        if state.get('ddlSha256') != hashes:
            raise RuntimeError('초기화 후 DDL 원본이 달라졌습니다. 기존 검증 DB에 덮어쓰지 않습니다.')
        print('기존 격리 스키마 보존: 초기 DDL을 다시 실행하지 않음.')
        return
    count = int(sql('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE();').strip())
    if count:
        raise RuntimeError('새 스키마가 비어 있지 않습니다. 부분 초기화/기존 fixture를 덮어쓰지 않습니다.')
    for path in DDL:
        sql(path.read_text())
    counts = query_json("SELECT JSON_OBJECT('baseTables',(SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_type='BASE TABLE'),'triggers',(SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema=DATABASE()),'routines',(SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema=DATABASE()),'views',(SELECT COUNT(*) FROM information_schema.views WHERE table_schema=DATABASE()));")[0]
    if counts != {'baseTables': 21, 'triggers': 10, 'routines': 2, 'views': 2}:
        raise RuntimeError('기존 검증 DDL의 구조 수와 다릅니다.')
    state.update(schemaInitialized=True, ddlSha256=hashes, schemaObjects=counts)
    save_state(state)
    print('기존 DDL 원문 적용: 21 tables, 10 triggers, 2 routines, 2 views. 업무 fixture 없음.')


def up():
    state, current = own_guard()
    if not current:
        with socket.socket() as probe:
            try:
                probe.bind(('127.0.0.1', 33087))
            except OSError as error:
                raise RuntimeError('격리 MySQL 포트를 다른 작업이 사용 중입니다.') from error
    compose('up', '-d', '--no-build', '--pull', 'never', 'mysql')
    for _ in range(60):
        health = docker('container', 'inspect', CONTAINER, '--format', '{{if .State.Health}}{{.State.Health.Status}}{{end}}').stdout.strip()
        if health == 'healthy':
            break
        time.sleep(2)
    else:
        raise RuntimeError('격리 MySQL health 대기 시간 초과. 기존 환경은 변경하지 않았습니다.')
    _, current = own_guard(require_container=True)
    state['containerId'] = current['id']
    save_state(state)
    schema()
    environment()
    print('격리 MySQL 준비: 127.0.0.1:33087 / network ' + NETWORK)


def environment():
    state, current = own_guard(require_container=True)
    settings = query_json("SELECT JSON_OBJECT('version',VERSION(),'versionComment',@@version_comment,'lowerCaseTableNames',@@lower_case_table_names,'sqlMode',@@sql_mode,'characterSetServer',@@character_set_server,'collationServer',@@collation_server,'databaseCollation',@@collation_database,'timeZone',@@time_zone,'systemTimeZone',@@system_time_zone,'transactionIsolation',@@transaction_isolation,'bufferPoolBytes',@@innodb_buffer_pool_size,'queryCacheVariableCount',(SELECT COUNT(*) FROM performance_schema.global_variables WHERE VARIABLE_NAME LIKE 'query_cache%'),'performanceSchema',@@performance_schema);")[0]
    columns = query_json("SELECT JSON_OBJECT('table',table_name,'column',column_name,'type',column_type,'nullable',is_nullable,'default',column_default,'collation',collation_name) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name IN ('project_post','member','liked_content','project_comment','project_index_outbox') ORDER BY table_name,ordinal_position;")
    indexes = query_json("SELECT JSON_OBJECT('table',table_name,'index',index_name,'column',column_name,'sequence',seq_in_index,'nonUnique',non_unique) FROM information_schema.statistics WHERE table_schema=DATABASE() ORDER BY table_name,index_name,seq_in_index;")
    constraints = query_json("SELECT JSON_OBJECT('table',table_name,'constraint',constraint_name,'type',constraint_type) FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() ORDER BY table_name,constraint_name;")
    triggers = query_json("SELECT JSON_OBJECT('name',trigger_name,'table',event_object_table,'event',event_manipulation,'timing',action_timing,'bodySha256',SHA2(action_statement,256)) FROM information_schema.triggers WHERE trigger_schema=DATABASE() ORDER BY trigger_name;")
    routines = query_json("SELECT JSON_OBJECT('name',routine_name,'type',routine_type,'bodySha256',SHA2(routine_definition,256)) FROM information_schema.routines WHERE routine_schema=DATABASE() ORDER BY routine_name;")
    report = {'checkedAt': datetime.now(timezone.utc).isoformat(), 'scope': '전용 MySQL에 기존 DDL을 원문 적용; 기존 ETCH DB에는 접속하지 않음', 'project': PROJECT, 'schema': SCHEMA, 'imageTag': IMAGE, 'imageId': IMAGE_ID, 'containerId': current['id'], 'volume': VOLUME, 'settings': settings, 'ddlSha256': state['ddlSha256'], 'schemaObjects': state['schemaObjects'], 'columns': columns, 'indexes': indexes, 'constraints': constraints, 'triggers': triggers, 'routines': routines, 'services': ['mysql'], 'backgroundWorkers': 'No Spring/ES/Redis/Logstash service in this compose; JPA test controls its own scope', 'credentials': 'New local-only random values, omitted'}
    (STATE / 'environment.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'mysqlVersion': settings['version'], 'lowerCaseTableNames': settings['lowerCaseTableNames'], 'schemaObjects': state['schemaObjects'], 'environmentEvidence': '.local/project-list-mysql/environment.json'}, ensure_ascii=False))



def dependencies():
    if STATE_FILE.exists() or DEPENDENCIES.exists():
        raise RuntimeError('Existing dependency/environment selection is preserved; use its recorded images instead of rebuilding in place.')
    DEPENDENCIES.parent.mkdir(parents=True, exist_ok=True)
    iid = DEPENDENCIES.with_suffix('.mysql-image-id')
    docker('build', '--iidfile', str(iid), '-f', str(ROOT / 'local/Dockerfile.mysql'), '-t', 'etch-submission-mysql:local', str(ROOT))
    docker('pull', BUILDER_REFERENCE)
    image_id = iid.read_text().strip()
    builder_id = docker('image', 'inspect', BUILDER, '--format', '{{.Id}}').stdout.strip()
    DEPENDENCIES.write_text(json.dumps({'mysqlImageId': image_id, 'builderImageId': builder_id,
        'builderReference': BUILDER_REFERENCE, 'allowExistingDependencyCache': False,
        'mysqlDockerfileSha256': hashlib.sha256((ROOT / 'local/Dockerfile.mysql').read_bytes()).hexdigest(),
        'note': 'New local image/dependency resolution; this does not inherit historical search approval.'}, indent=2) + '\n')
    print('Candidate dependency images prepared from included Dockerfile and pinned upstream reference.')


def cache():
    own_guard()
    builder_id = docker('image', 'inspect', BUILDER, '--format', '{{.Id}}').stdout.strip()
    allow_existing = not DEPENDENCIES.exists() or json.loads(DEPENDENCIES.read_text()).get('allowExistingDependencyCache') is True
    source = resource('volume', GRADLE_SOURCE_VOLUME) if allow_existing else None
    target = STATE / 'gradle-cache'
    ready = STATE / 'gradle-cache-ready.json'
    if ready.exists():
        info = json.loads(ready.read_text())
        if info['builderImageId'] != builder_id or not target.is_dir():
            raise RuntimeError('전용 Gradle cache의 준비 기록이 다릅니다.')
        print('기존 전용 cache 사본 재사용; 원본 Gradle volume은 마운트하지 않음.')
        return
    if target.exists() and any(target.iterdir()):
        raise RuntimeError('부분 cache 사본을 덮어쓰지 않습니다. 상태를 먼저 확인하세요.')
    target.mkdir(exist_ok=True)
    if not source:
        # Resolve dependencies before entering the internal-only MySQL test network.
        # No DB, credentials or original source/cache is mounted in this downloader.
        resolver = STATE / 'resolve-dependencies.gradle'
        resolver.write_text("allprojects { tasks.register('resolveSubmissionDependencies') { doLast { ['compileClasspath','runtimeClasspath','testCompileClasspath','testRuntimeClasspath'].each { configurations.getByName(it).resolve() } } } }\n")
        docker('run', '--rm', '--name', PROJECT + '-dependency-resolve', '--network', 'bridge', '--user', '0',
               '--memory=1200m', '--cpus=2', '-e', 'GRADLE_USER_HOME=/cache',
               '-v', str(ROOT / 'etch/backend/business-server') + ':/workspace',
               '-v', str(target) + ':/cache', '-v', str(resolver) + ':/task/resolve.gradle:ro',
               '-w', '/workspace', BUILDER, 'gradle', '--no-daemon', '--no-build-cache', '--max-workers=1',
               '-Dorg.gradle.jvmargs=-Xmx512m -XX:MaxMetaspaceSize=256m', '-I', '/task/resolve.gradle', 'resolveSubmissionDependencies')
        ready.write_text(json.dumps({'sourceVolume': None, 'sourceMountMode': None, 'builderImage': BUILDER,
            'builderImageId': builder_id, 'copyDirectory': '.local/project-list-mysql/gradle-cache',
            'offline': True, 'preparedAt': datetime.now(timezone.utc).isoformat(),
            'note': 'New candidate-owned cache resolved from public registries in a separate downloader; actual tests stay offline on the internal MySQL network.'}, indent=2) + '\n')
        print('Candidate dependencies downloaded without database credentials; tests remain offline.')
        return
    docker('run', '--rm', '--name', PROJECT + '-cache-copy', '--network', 'none', '--user', '0',
           '--memory=512m', '--cpus=1', '--label', 'org.etch.validation=' + LABEL,
           '-v', GRADLE_SOURCE_VOLUME + ':/source:ro', '-v', str(target) + ':/target',
           '--entrypoint', '/bin/sh', BUILDER, '-c', 'mkdir -p /target/caches && cp -a /source/caches/modules-2 /target/caches/')
    ready.write_text(json.dumps({'sourceVolume': GRADLE_SOURCE_VOLUME, 'offline': True, 'sourceMountMode': 'read-only', 'copiedPaths': ['caches/modules-2'], 'excluded': ['build-cache', 'daemon', 'init scripts', 'source', 'credentials'], 'builderImage': BUILDER,
                               'builderImageId': builder_id, 'copyDirectory': '.local/project-list-mysql/gradle-cache',
                               'contains': 'Dependency/build cache only; original source, environment and DB not mounted during tests',
                               'preparedAt': datetime.now(timezone.utc).isoformat()}, indent=2) + '\n')
    print('Gradle cache 사본 준비: 원본 volume 읽기 전용, 이후 검증은 프로젝트 .local 사본만 사용.')


def test(stage, selectors, build):
    state, current = own_guard(require_container=True)
    if not state['schemaInitialized'] or current['status'] != 'running':
        raise RuntimeError('up으로 격리 MySQL을 먼저 준비하세요.')
    cache()
    init_script = STATE / 'build-dir.gradle'
    init_script.write_text("allprojects { layout.buildDirectory = layout.projectDirectory.dir('build/project-list-mysql') }\n")
    evidence = ROOT / '.local/submission-validation/project-list-mysql'
    evidence.mkdir(parents=True, exist_ok=True)
    selectors = selectors or ['com.ssafy.etch.project.service.ProjectListMysqlIntegrationTest']
    if not all(selector.startswith('com.ssafy.etch.') and all(char.isalnum() or char in '.*_$' for char in selector) for selector in selectors):
        raise RuntimeError('검증 selector는 ETCH Java 테스트만 허용합니다.')
    offline = json.loads((STATE / 'gradle-cache-ready.json').read_text()).get('offline', True)
    options = []
    for selector in selectors:
        options += ['--tests', selector]
    args = ['run', '--rm', '--name', PROJECT + '-test-runner', '--user', '0', '--network', NETWORK,
            '--memory=1200m', '--cpus=2', '--label', 'org.etch.validation=' + LABEL,
            '--env-file', str(STATE / 'test.env'), '-e', 'ETCH_PROJECT_MYSQL_RUN=1',
            '-e', 'ETCH_PROJECT_MYSQL_STAGE=' + stage, '-e', 'ETCH_PROJECT_MYSQL_REPORT_DIR=/evidence/project-list-mysql',
            '-e', 'GRADLE_USER_HOME=/cache',
            '-v', str(ROOT / 'etch/backend/business-server') + ':/workspace',
            '-v', str(STATE / 'gradle-cache') + ':/cache',
            '-v', str(init_script) + ':/task/build-dir.gradle:ro',
            '-v', str(evidence) + ':/evidence/project-list-mysql', '-w', '/workspace', BUILDER,
            'gradle', *(['--offline'] if offline else []), '--no-daemon', '--no-build-cache', '--max-workers=1',
            '-Dorg.gradle.jvmargs=-Xmx512m -XX:MaxMetaspaceSize=256m', '-I', '/task/build-dir.gradle',
            'test', '--rerun-tasks'] + options + (['bootJar'] if build else [])
    result = docker(*args, check=False)
    # Gradle logs are useful evidence, but this environment's random credentials are never retained there.
    text = result.stdout + result.stderr
    for line in (STATE / 'mysql.env').read_text().splitlines():
        if '=' in line:
            value = line.split('=', 1)[1]
            text = text.replace(value, '<redacted>')
    filename = 'runner-' + stage + '-' + datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ') + '.log'
    (STATE / filename).write_text(text)
    print(json.dumps({'stage': stage, 'selectors': selectors, 'buildJar': build, 'exitCode': result.returncode,
                      'log': '.local/project-list-mysql/' + filename,
                      'buildDirectory': 'etch/backend/business-server/build/project-list-mysql',
                      'evidenceDirectory': '.local/submission-validation/project-list-mysql'}, ensure_ascii=False))
    if result.returncode:
        raise RuntimeError('격리 MySQL 테스트 실패. 프로젝트 전용의 비밀값 제거 로그를 확인하세요.')


def preservation():
    before = json.loads((STATE / 'existing-etch-before.json').read_text())
    after = existing_etch()
    for value in before.values():
        value['mounts'] = sorted(value['mounts'], key=lambda mount: (mount.get('Destination', ''), mount.get('Type', ''), mount.get('Name', ''), mount.get('Source', '')))
    unchanged = all(after.get(name) == value for name, value in before.items())
    report = {'checkedAt': datetime.now(timezone.utc).isoformat(), 'existingEtchCount': len(before), 'existingMetadataUnchanged': unchanged, 'comparison': 'existing container IDs, image IDs, status/start/finish time and mount metadata (order normalized; Docker inspect array order is not identity); no existing DB connections or byte-level data claim', 'newValidationStatus': container_metadata(CONTAINER)['status'] if container_metadata(CONTAINER) else 'absent'}
    (STATE / 'preservation.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    if not unchanged:
        raise RuntimeError('기존 ETCH 컨테이너 메타데이터 변경을 발견했습니다. 범위를 조사하세요.')
    return report


def status():
    _, current = own_guard()
    print(json.dumps({'project': PROJECT, 'status': current['status'] if current else 'absent', 'preservation': preservation()}, ensure_ascii=False))


def down():
    own_guard()
    compose('down', '--timeout', '30')
    print('Submission-only containers/network removed; MySQL volume retained. Original resources untouched.')


def stop():
    _, current = own_guard()
    if current and current['status'] != 'exited':
        compose('stop', '--timeout', '30', 'mysql')
    print(json.dumps({'stoppedOnly': CONTAINER, 'volumeDeleted': False, 'preservation': preservation()}, ensure_ascii=False))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['init', 'up', 'schema', 'environment', 'status', 'stop', 'cache', 'test', 'down', 'dependencies'])
    parser.add_argument('--stage', choices=['current', 'improved'], default='improved')
    parser.add_argument('--tests', action='append', help='test 전용 Java selector; 여러 번 지정 가능')
    parser.add_argument('--related', action='store_true', help='보존된 관련 50검사 클래스 목록 사용; MySQL 계측을 먼저 실행')
    parser.add_argument('--build', action='store_true', help='test 뒤 별도 build/project-list-mysql JAR도 생성')
    args = parser.parse_args()
    try:
        if args.action == 'test':
            selectors = args.tests
            if args.related:
                if selectors: raise ValueError('--related and --tests cannot be combined')
                selectors = [suite['name'] for suite in json.loads((ROOT / 'docs/portfolio/evidence/project-list-mysql/related-tests.json').read_text())['suites']]
            test(args.stage, selectors, args.build)
        else:
            globals()[args.action]()
    except (RuntimeError, OSError, ValueError) as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
