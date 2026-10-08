# 제출 사본의 백엔드 검증

2026-10-08, 독립 제출 사본에서 실행했다. 기존 checkout·환경 파일·업무 DB·볼륨은 사용하지 않았다. 기존 의존 이미지와 Gradle `modules-2` 의존성 캐시는 재사용했으며, 캐시는 읽기 전용으로 사본의 `.local`에 복사한 다음 그 사본만 마운트했다. 소스·Gradle build cache·daemon·기존 환경 파일은 복사하지 않았다.

## 이번 실행 결과

| 항목 | 결과와 범위 |
|---|---|
| MySQL 계측 | MySQL 8.4.12의 새로운 합성 DB에서 개선본 계측 테스트 1개 통과. 158조건의 전체 응답 JSON이 보존된 기존 개선본 결과와 일치했다. 이전 느린 구현은 다시 실행하지 않았다. |
| JDBC 실행 | 서로 다른 작성자 100건의 첫 전체 페이지는 이번에도 2회. 이전 102회는 보존된 원본과 비교한 값이다. 마지막·빈 페이지는 별도 결과다. |
| 관련 테스트 | 50개 통과. 실제 MySQL MockMvc 5개와 H2/단위검사를 포함하며, 50개 전체가 MySQL HTTP end-to-end는 아니다. |
| 애플리케이션 빌드 | 사본의 Java 소스로 JAR 빌드 성공. 로컬 callback/CORS 기본값 정제도 이 JAR에 포함됐다. 과거 승인된 JAR와 동일하다고 주장하지 않는다. |
| 실제 검색 | 새로운 MySQL·Redis·ES/Nori 9.4.7·Logstash 9.5.4에 고정 합성 코퍼스 적재. 채용·뉴스 원본 각23건, 상태·ES 각24건(tombstone 포함)의 전체 대조에서 차이 0건. 실제 API 30질의와 통합4건은 별도 검색 기록에 연결한다. |
| 실제 outbox 복구 | 새 합성 프로젝트 1건에서 ES 중단 → API 수정과 DB/outbox 유지 → ES 재개 후 자동 색인 → 비공개·삭제 tombstone 및 권한을 17항목 확인했다. SIGKILL·전체 이관 실험은 반복하지 않았다. |
| 종료 | `etch-submission`과 `etch-submission-project-list-mysql`의 신규 컨테이너·네트워크만 제거했다. 신규 MySQL/ES/Logstash 볼륨 4개와 checkpoint/PQ/DLQ는 보존했다. 기존 정지 환경은 기동하지 않았다. |

주 계측 경로는 Controller 직접 호출 → 실제 JPA → DTO → JSON이다. JDBC 호출 횟수이며 Formula 내부 집계 비용·운영 응답시간 개선을 뜻하지 않는다. 원래 158조건 결과와 과거 검색 비교 FAIL은 그대로 보존했다.

## 재현 명령

Apple Silicon/ARM64, Docker, Python 3 환경을 사용한다. 이번 실행의 Python은 3.9.6이었다. 다른 아키텍처는 아래 ARM64 MySQL 이미지를 그대로 지원한다고 보지 않는다. 각 명령은 제출 사본 루트에서 실행한다. `.env`와 `.local`의 임의 자격증명·새 데이터는 Git에서 제외한다.

새 머신에서 과거 ETCH 이미지나 캐시가 없으면 먼저 포함된 Dockerfile과 고정 Gradle 참조로 의존성을 준비한다. 공개 registry·서명된 OS 패키지 저장소에 접근할 수 있어야 한다. 패키지가 더 이상 제공되지 않으면 오류를 확인하고 명시적으로 버전을 검토하며, 과거 승인 값을 고쳐 맞추지 않는다.

```sh
# 새 머신용. 이번 실행에서는 기존 동일 의존 이미지를 재사용하여 이 빌드를 반복하지 않았다.
python3 local/project-list-mysql.py dependencies
python3 local/project-list-mysql.py init
python3 local/project-list-mysql.py up
python3 local/project-list-mysql.py test --stage improved --build
python3 local/project-list-mysql.py test --stage improved --related --build
python3 local/project-list-mysql.py down
```

`dependencies`를 실행한 새 머신에서는 빈 사본 전용 Gradle 캐시를 별도 다운로드 컨테이너에서 채운다. 이 컨테이너에는 DB·자격증명을 전달하지 않으며 실제 테스트는 내부 MySQL 네트워크에서 offline으로 실행한다. 과거 volume 이름은 필수 조건이 아니다. 이번 실행은 기존 이미지 SHA와 읽기 전용 `modules-2` 캐시의 명시적 재사용 경로를 사용했다. 캐시 없는 다운로드 경로는 코드/CLI/Compose 문법을 검토했지만 이번에 다시 다운로드·이미지 빌드를 수행하지 않았다.

실제 검색과 outbox 확인에는 그 JAR와 별도의 새 합성 환경을 사용한다. 기존 `.env`나 동명 자원을 임의로 채택하지 않으므로 새 사본에서 시작한다.

```sh
# 새 머신용 ES/Nori·Logstash·MySQL·Java 의존 이미지 준비. 이번에는 재빌드하지 않았다.
python3 local/submission-runtime.py dependencies
python3 local/submission-runtime.py init
python3 local/submission-runtime.py up
# health/ES 준비 후 한 번만 실행: 고정 합성 코퍼스이며 덮어쓰기하지 않음
python3 local/submission-runtime.py seed
python3 local/submission-runtime.py sync
python3 local/search-sync.py compare job
python3 local/search-sync.py compare news
# 고정 검색 관측을 먼저 완료하고, 이후 추가 합성 프로젝트의 복구를 확인
python3 deploy/rc/submission_search.py observe --api-origin http://127.0.0.1:18476 --output .local/submission-validation/search-live.json
python3 local/submission-smoke.py
python3 local/submission-runtime.py down
```

API는 `http://127.0.0.1:18476`, ES는 `http://127.0.0.1:19476`에 로컬 바인딩한다. 이 실행은 새 이미지/JAR의 기능 진단이며 기존 검색 엔진 기준선 승인이나 외부 서비스 운영 승인이 아니다. `submission-smoke.py`는 새로 만든 프로젝트만 변경하고 ES를 정상 정지·재개한다. 원본의 SIGKILL/전체 PQ·DLQ 장애 실험은 과거 근거로 별도 보존한다.

## 코드와 근거

- [EntityGraph 목록 Repository](../etch/backend/business-server/src/main/java/com/ssafy/etch/project/repository/ProjectRepository.java)
- [MySQL 계측·JSON 계약](../etch/backend/business-server/src/test/java/com/ssafy/etch/project/service/ProjectListMysqlIntegrationTest.java), [JDBC 계수기](../etch/backend/business-server/src/test/java/com/ssafy/etch/project/service/MysqlQueryCapture.java), [MySQL MockMvc 권한](../etch/backend/business-server/src/test/java/com/ssafy/etch/project/service/ProjectListMysqlAuthorizationIntegrationTest.java)
- [보존된 이전 비교 JSON](portfolio/evidence/project-list-mysql/comparison.json), [당시 관련 테스트 범위](portfolio/evidence/project-list-mysql/related-tests.json)
- [트랜잭션 outbox 기록](../etch/backend/business-server/src/main/java/com/ssafy/etch/search/indexing/ProjectIndexOutbox.java), [worker](../etch/backend/business-server/src/main/java/com/ssafy/etch/search/indexing/ProjectIndexWorker.java), [revision/tombstone writer](../etch/backend/business-server/src/main/java/com/ssafy/etch/search/indexing/ProjectIndexWriter.java), [이번 복구 재현 도구](../local/submission-smoke.py)
- [이번 실행 요약](evidence/submission-backend.json). raw XML·로그·새 합성 측정 JSON은 사본의 제외된 `.local/submission-validation`에 보관했다.

초기에는 로컬 Docker의 태그 조회가 실패하여 확인된 동일 image SHA로 선택했다. 새 smoke 도구의 JAR 이름 오기와 대조 도구의 인자 누락도 실행 전에/읽기 단계에서 바로잡았다. 검색 관측 도구의 `/api/v1` 경로 오류로 난 초기 401과 수정 후 직접 backend 결과는 별도 파일로 보존하며 앱 권한을 완화하지 않았다.
