# 소스·검증 근거와 자산

## 원본과 제출 사본

최신 개선 checkout의 `7ed428f07a661724c974954d47861df35070ab5b`에서 허용 목록을 먼저 작성한 뒤 일반 파일 복사로 시작했습니다. 원본 `.git`, refs, 객체, worktree, 하드링크와 symlink를 가져오지 않았습니다. 이 사본의 첫 커밋은 과거 실험을 수행한 커밋이 아닙니다.

| 주장 | 원본 근거 | 제출 사본에서 확인할 파일 | 동등성 확인 |
|---|---|---|---|
| outbox 재시도·최신 상태 | 2026-09-29 실제 로컬 프로젝트 회귀 22항목 | [결과](portfolio/evidence/phase7/migration-project-regression-v4.json), [worker](../etch/backend/business-server/src/main/java/com/ssafy/etch/search/indexing/ProjectIndexWorker.java) | 보존된 결과와 검색 구현의 원본 SHA-256 일치 |
| 작성자 추가 조회 제거 | `236bd38` 기준, `7c26dbd` 개선·계측 | [Repository](../etch/backend/business-server/src/main/java/com/ssafy/etch/project/repository/ProjectRepository.java), [158조건 비교](portfolio/evidence/project-list-mysql/comparison.json), [계측 provenance](portfolio/evidence/project-list-mysql/provenance.json) | 핵심 소스·원본 JSON 바이트 유지, 새 독립 실행은 별도 기록 |
| 현재 검색 기준선·과거 손실 | 2026-09-30 기준선 결정과 실행 기록 | [승인](portfolio/evidence/phase8/search-baseline-approval.json), [현재 결과](portfolio/evidence/phase8/es947-current-regression/summary.json), [과거 비교](portfolio/evidence/phase8/es947-final/summary.json) | 코퍼스·질의·라벨·승인·결과 원문 유지. 새 이미지 승인으로 확대하지 않음 |
| JDBC 증분·재전달 | 2026-09-29 격리 동기화 검사 | [결과](portfolio/evidence/phase7/migration-jdbc-regression-v4.json), [입력 설정](../local/logstash/pipeline), [복구 검사](../local/verify-logstash.py) | 기존 결과 재사용. 새 PQ/DLQ 장애 실험 수행으로 표시하지 않음 |

복사 전 허용 목록·파일별 원본 hash·선택 이유와 최종 사본 manifest는 Git 밖의 개인 작업 기록에 보관합니다. 이 사본에는 코드·고정 합성 데이터·좁게 선택한 근거만 포함합니다. AI 인계문, portfolio-kit 제작 자료, 원본 README는 개인 폴더와 원래 checkout에서 보존했습니다.

## 제출을 위해 바꾼 부분

- 일반/정적 프런트의 권리 미확정 raster import를 검토된 자체 SVG로 연결했습니다. 일반 API와 showcase 라우터의 구분은 유지합니다.
- README와 로컬 `/process` 표현을 읽기 쉽게 정리했습니다. 숫자의 조건과 실패 기록은 유지합니다.
- 서버 CORS·OAuth callback의 운영주소 기본값을 로컬 주소로 바꿨습니다. 권한 검사·토큰 검증은 그대로입니다.
- 실행 도구의 프로젝트·캐시·포트·증거 경로를 사본 전용으로 분리했습니다. 과거 실행 환경을 새 실행에 숨겨서 재사용하지 않습니다.

검색 서비스·매핑·코퍼스·관련도 라벨의 값을 성적에 맞춰 변경하지 않았습니다. 과거 JAR·이미지 hash와 새 사본의 빌드 hash는 별개입니다.

## 자산과 저작권

기존 README에 MIT 전문과 `Copyright (c) 2025 ETCH Team`이 있었고 이를 [LICENSE](../LICENSE)에 보존했습니다. 이 고지는 출처를 확인하지 못한 모든 외부 자산까지 권리가 확인됐다는 뜻은 아닙니다.

- 기존 raster 16개: 사본 제외. 원본 checkout에서는 보존.
- [자체 SVG 4개](../etch/frontend/src/assets/public): 기존 공개 산출물에서 검토한 etch·placeholder·profile·search를 사용.
- [대표 화면](assets/showcase-home.png): 2026-10-08 공개 정적 체험판의 실제 Chrome 캡처. 가상 데이터만 표시하며 새 화면을 만들어 성과를 연출하지 않음. [캡처 출처](assets/showcase-home.provenance.json).
- 런타임 라이브러리 고지: showcase 빌드가 실제 포함 모듈의 LICENSE를 `licenses.html`로 생성. 외부 폰트·추적 도구를 추가하지 않음.
- Gradle wrapper JAR: 원본 바이트와 내장 Apache 2.0 고지 확인. 내려받은 라이브러리와 빌드 결과는 Git에 포함하지 않음.
- 과거 이미지 inventory의 Nokogiri maintainer 메일: 공급자 MIT gemspec 메타데이터이며 실회원 데이터가 아님. 승인 hash가 묶인 원본 파일을 임의 편집하지 않음.

## 향후 About 제안

최종 공개 대상이 결정된 뒤 사용할 값이며 현재 원격 About은 변경하지 않았습니다.

- 설명: `채용·뉴스·프로젝트 탐색 서비스와 검색 색인 복구·목록 조회 개선 사례`
- Website: `https://etch-showcase.pages.dev/`
- Topics: `spring-boot`, `react`, `mysql`, `elasticsearch`, `transactional-outbox`

새 정제 코드가 원격에 공개된 뒤에만 해당 구현을 공개 코드로 소개합니다.
