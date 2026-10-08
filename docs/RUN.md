# 제출 사본 실행 안내

이 저장소는 독립된 로컬 사본입니다. 운영 환경 파일을 복사하거나 원본 checkout을 마운트하지 않습니다. Node 22와 npm, Python 3, Docker Desktop을 사용합니다. 이번 Mac 검증은 Node 22.14.0·npm 10.9.2·Docker 28.0.1·Python 3.9.6에서 수행했습니다.

## 정적 화면

```sh
cd etch/frontend
npm ci --ignore-scripts --no-audit --no-fund
npm test
npm run test:showcase
npm run build
npm run build:showcase
npm run preview:showcase
```

접속: `http://127.0.0.1:5207/`, 기술 사례: `http://127.0.0.1:5207/process`. 종료는 실행 터미널에서 Ctrl+C입니다. 두 번째 터미널에서 같은 frontend 폴더의 `npm run test:showcase:browser`를 실행하면 설치된 Chrome으로 검사합니다.

`build`는 실제 API 모드, `build:showcase`는 가상 데이터·메모리 편집 모드입니다. showcase는 `.env`를 읽지 않으며 API·OAuth·WebSocket 연결 없이 실행됩니다. 앱의 설정을 바꿔 실제 인증을 우회하지 않습니다.

정적 산출물은 `dist-showcase/`에만 생성됩니다. 산출물 검사기는 아래 명령입니다. 새로 npm advisory를 조회하는 단계이며 결과를 과거 검사처럼 혼동하지 않습니다.

```sh
node scripts/check-showcase.mjs --refresh-audit --output ../../.local/showcase/review.json
```

이번 제출 작업에서는 같은 lock의 과거 npm 감사 응답과 입력 hash를 재사용하고, **변경된 정적 파일·포함 모듈·라이선스·패턴은 새로 검사**했습니다. 재사용 응답은 Git에 넣지 않습니다. 일반 API 빌드 `dist/`는 이 정적 업로드 대상으로 사용하지 않습니다.

## MySQL·검색 서버

[사본 전용 백엔드 실행·검증 안내](validation-backend.md)를 따릅니다. 실행 도구는 환경값을 새로 생성하며 파일에 저장한 값은 Git에서 제외합니다. 사본 전용 프로젝트와 볼륨을 사용하고, 종료 명령은 기존 환경과 데이터 볼륨을 제거하지 않습니다.

일반 프런트 개발 서버는 `npm run dev`로 실행합니다. `LOCAL_API_TARGET`의 기본값은 사본 backend의 `http://localhost:18476`이며, 다른 포트를 선택했다면 명시적으로 지정하세요. 공개 검색은 외부 OAuth 없이 읽을 수 있고, 인증·쓰기 API의 권한은 유지됩니다.

## 검색 평가

```sh
# 저장 근거·승인 원문·고정 데이터 및 코드 hash
python3 deploy/rc/submission_search.py verify
# 기존 guard의 외부 IO 없는 검사
python3 deploy/rc/submission_search.py offline-tests
python3 -m unittest discover -s deploy/rc -p test_submission_search.py -v
python3 local/evaluation/test-evaluator.py
python3 local/test-search-sync.py
```

실제 30질의·통합검색 4개는 [독립 검색 검사 안내](../deploy/rc/SUBMISSION_SEARCH.md)의 `observe`로 실행합니다. 사본 환경에 고정 코퍼스를 준비한 뒤 수행해야 합니다. 기록 파일이 있으면 덮어쓰지 않고 새 이름을 지정합니다.

기존 `local/verify-project-recovery.py`, `verify-logstash.py` 등은 과거 실험의 코드를 보여주기 위해 보존했습니다. 기존 환경을 대상으로 그대로 실행하는 대신 위 사본 전용 절차와 명시된 검사 범위를 사용합니다. 역사 Git 객체를 요구하는 원래 승인 활성화 경로는 사본에서 승인받은 새 artifact로 대체하지 않습니다.
