"""7차 설치·이관 DB를 읽는 고정 코퍼스/동기화 대조 어댑터. seed 진입점 없음."""
import importlib.util
import hashlib
import json
import sys
import runtime

def load(name, path):
    spec = importlib.util.spec_from_file_location(name, runtime.ROOT / path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module

if runtime.PROJECT not in ('etch-phase7-fresh-v4', 'etch-phase7-migration'):
    raise ValueError('7차 명시적 후보 환경만 허용')
runtime.RESOURCES = runtime.ROOT / 'etch/backend/business-server/src/main/resources/es'
prepare = load('rc_frozen_prepare', 'local/evaluation/prepare.py')
prepare.load_helpers = lambda: runtime

def verify_contract_freeze():
    """Keep the Phase4 freeze; permit only the reviewed Jackson mapper import move."""
    manifest = json.loads((runtime.ROOT / 'local/evaluation/manifest.json').read_text())
    for name, expected in manifest['dataHashes'].items():
        actual = (runtime.ROOT / 'local/evaluation' / name).read_bytes()
        if hashlib.sha256(actual).hexdigest() != expected:
            raise ValueError('고정 코퍼스/질의/라벨 변경 거부: ' + name)
    mapper = 'etch/backend/business-server/src/main/java/com/ssafy/etch/search/indexing/ProjectIndexWriter.java'
    old = b'import com.fasterxml.jackson.databind.ObjectMapper;'
    new = b'import tools.jackson.databind.ObjectMapper;'
    adjustments = []
    for name, expected in manifest['baselineFileHashes'].items():
        actual = (runtime.ROOT / name).read_bytes()
        digest = hashlib.sha256(actual).hexdigest()
        if digest == expected:
            continue
        restored = actual.replace(new, old, 1)
        if name != mapper or actual.count(new) != 1 or hashlib.sha256(restored).hexdigest() != expected:
            raise ValueError('승인된 호환 import 외 고정 검색 코드/매핑 변경 거부: ' + name)
        adjustments.append({'file': name, 'frozenSha256': expected, 'currentSha256': digest,
                            'change': 'Only ObjectMapper import moves from Jackson2 to Jackson3; all other bytes equal Phase4 freeze.'})
    return {**manifest, 'compatibilityAdjustments': adjustments,
            'corpusLabelsMappingsAndSearchPolicyUnchanged': True}

prepare.verify_freeze = verify_contract_freeze
def forbidden_seed():
    raise ValueError('이관 검증 중 seed 실행 금지')
prepare.seed = forbidden_seed
sync = load('rc_public_sync', 'local/search-sync.py')
sync.h = runtime
sync.ES = runtime.ES_URL
sync.REPORT = runtime.STATE_DIR / 'public-sync-compare.json'
