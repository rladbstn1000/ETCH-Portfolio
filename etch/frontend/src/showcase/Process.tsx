import { Link } from "react-router";

const sourceRoot = "https://github.com/rladbstn1000/ETCH-Portfolio/blob/main/";

const cases = [
  { n: "01", title: "프로젝트를 저장한 뒤, 검색 색인이 실패한다면?", subtitle: "트랜잭션 outbox와 최신 상태 재처리", rows: [
    ["문제", "팀 구현은 DB 저장 후 AFTER_COMMIT 이벤트로 색인을 반영했습니다. 그 시점에 Elasticsearch가 중단되면 DB 저장은 성공해도 검색 반영을 지속 재시도할 기록이 없었습니다."],
    ["개인 변경", "프로젝트와 outbox를 같은 DB 트랜잭션에 저장하고, 단일 worker가 최신 원본을 재처리하도록 바꿨습니다. revision과 삭제 tombstone으로 오래된 재시도에 의한 역전·부활을 방어합니다."],
    ["검증", "실제 MySQL·Elasticsearch 환경에서 저장 rollback, ES 중단 중 수정, 재시작 후 반영, 비공개·삭제 방어를 확인했습니다. 이 설명은 당시 로컬 검증 22항목에 근거합니다."],
    ["결과", "검증한 중단·재시작 상황에서 원본의 최신 revision·내용·삭제 상태가 색인과 일치했습니다. 아래 화면은 이 worker를 실행하거나 장애를 발생시키지 않습니다."],
    ["한계", "다중 worker 경쟁 처리와 ES 전체 데이터 소실의 자동 복구까지 완료한 것은 아닙니다. 무제한 재시도로 모든 장애가 해결된다는 의미도 아닙니다."],
  ], sources: [
    ["outbox worker", "etch/backend/business-server/src/main/java/com/ssafy/etch/search/indexing/ProjectIndexWorker.java"],
    ["worker 테스트", "etch/backend/business-server/src/test/java/com/ssafy/etch/search/indexing/ProjectIndexWorkerTest.java"],
    ["복구 재현 도구", "local/verify-project-recovery.py"],
  ] },
  { n: "02", title: "매번 전체 조회 대신, 변경된 상태를 전달하기", subtitle: "채용·뉴스 변경 추적과 복구의 경계", rows: [
    ["문제", "팀 Logstash 구성은 주기적으로 전체 자료를 조회했습니다. 원본 갱신, 삭제, 전달 실패를 구분해 확인할 기준이 부족했습니다. 뉴스 URL SHA-256과 채용 외부 ID 중복 방지는 이미 팀 구현에 있었습니다."],
    ["개인 변경", "MySQL 변경 추적과 revision, JDBC 겹침 조회, version/tombstone을 연결했습니다. Logstash의 PQ·DLQ를 사용하고 현재 DB·ES의 상태를 대조하는 절차를 추가했습니다."],
    ["검증", "동일 시각과 fetch 경계, 삭제, 날짜 경계, PQ 자동 복구와 별도 운영자 DLQ 복구를 실제 로컬 환경에서 확인했습니다. JDBC 동기화 24항목과 version 충돌 처리 4항목을 대조했습니다."],
    ["결과", "시험한 자동 재전달과 필요한 ID의 운영자 복구 후 revision·내용·tombstone을 대조했습니다. 반환 건수나 checkpoint 이동만으로 동기화 성공을 판정하지 않습니다."],
    ["한계", "checkpoint는 ES 성공 기록이 아니며 PQ가 비어도 내용 일치를 보장하지 않습니다. 매핑 오류 등 DLQ 원인은 운영자 수정과 재대조가 필요합니다."],
  ], sources: [
    ["변경 추적 스키마", "local/mysql/003-job-news-sync.sql"],
    ["채용 Logstash 설정", "local/logstash/pipeline/job.conf"],
    ["뉴스 Logstash 설정", "local/logstash/pipeline/news.conf"],
    ["증분·삭제·경계 검사", "local/verify-incremental-sync.py"],
    ["복구 도구 테스트", "local/test-search-sync.py"],
    ["실행 안내", "docs/RUN.md"],
  ] },
  { n: "03", title: "검색이 바뀌면, 좋아졌다고 말하기 전에 비교하기", subtitle: "고정 합성 평가와 승인된 현재 기준선", rows: [
    ["문제", "팀의 키워드·Nori 검색 위에서 변경 전후의 결과를 일관되게 비교할 기준이 필요했습니다."],
    ["개인 변경", "유형별 24개 합성 자료, 30개 질의, 720개 관련도 판정을 고정하고 실제 API를 평가했습니다. 기능·권한·데이터 계약, 현재 기준선 회귀, 과거 엔진 비교를 별도로 기록합니다."],
    ["검증", "ES/Nori 9.4.7·Java Client 9.4.5에서 실제 30질의와 통합검색 4개를 평가했습니다. 순위 손실을 확인하고 수용한 기준선과 실행 결과가 일치했습니다."],
    ["결과", "과거 엔진 대비 React 관련 채용·뉴스 각 1질의에서 직접 관련 결과가 2위에서 3위로 내려갔고, 각 nDCG@5는 0.926045 → 0.881078로 낮아졌습니다. 결과 소실은 없었습니다. 직접 관련 결과가 유지되는 것을 확인하고 이 순위 손실을 현재 기준선의 한계로 수용했습니다."],
    ["한계", "과거 2/30 불일치는 FAIL로 보존합니다. AI 도구로 작성한 작은 합성 코퍼스·관련도 라벨을 사용했으며 실사용자 정확도는 미측정입니다. 이 체험판은 단순 문자열 검색으로 동작합니다."],
  ], sources: [
    ["검색 평가기", "deploy/rc/evaluate.py"],
    ["고정 합성 코퍼스", "local/evaluation/corpus.json"],
    ["고정 질의·관련도", "local/evaluation/queries.json"],
    ["AI 도구를 이용한 라벨 작성 방식", "local/evaluation/build-corpus.py"],
    ["독립 사본 검색 검사 안내", "deploy/rc/SUBMISSION_SEARCH.md"],
  ] },
  { n: "04", title: "MySQL 프로젝트 목록 조회 개선", subtitle: "응답을 유지하며 작성자 추가 SELECT 제거", rows: [
    ["문제", "목록의 작성자 닉네임을 읽을 때 지연 로딩이 발생했습니다. 서로 다른 작성자 100명의 프로젝트 100건에서는 목록·전체 COUNT 2회에 작성자 SELECT 100회가 더해졌습니다."],
    ["재현", "실제 MySQL 8.4.12의 합성 데이터에서 같은 작성자와 서로 다른 작성자를 나누고, 페이지 크기 1·3·10·30·100과 세 정렬을 비교했습니다. 호출마다 새 영속성 컨텍스트를 사용했습니다."],
    ["개인 변경", "목록 메서드에만 EntityGraph로 필요한 작성자 로딩을 지정했습니다. 전역 EAGER 변경이나 새 캐시 도입 없이 해당 조회 계획만 바꿨습니다."],
    ["결과", "서로 다른 작성자 100건의 첫 전체 페이지에서 실제 JDBC 실행 102→2회를 확인했습니다. 동일 158조건의 전체 응답 JSON이 일치했고 목록 조회의 데이터 불변을 확인했습니다."],
    ["한계", "합성 데이터와 지정한 DB 목록 경로의 측정입니다. Formula 내부 집계 비용은 남아 있고 운영 응답시간은 측정하지 않았습니다. 이 정적 페이지는 해당 DB 조회를 실행하지 않으며 공개 화면 속도 개선을 뜻하지 않습니다."],
  ], sources: [
    ["EntityGraph Repository", "etch/backend/business-server/src/main/java/com/ssafy/etch/project/repository/ProjectRepository.java"],
    ["MySQL 계측 테스트", "etch/backend/business-server/src/test/java/com/ssafy/etch/project/service/ProjectListMysqlIntegrationTest.java"],
    ["전후 비교 결과", "docs/portfolio/evidence/project-list-mysql/comparison.json"],
  ] },
];

const mysqlCounts = [[1, 3], [3, 5], [10, 12], [30, 32], [100, 102]];

function MysqlMeasurement() {
  return <div className="space-y-5 border-t border-gray-100 p-6 sm:p-8">
    <table className="w-full table-fixed border-collapse text-center text-xs sm:text-sm">
      <caption className="pb-4 text-left text-sm leading-6 text-gray-600"><strong className="text-gray-900">첫 전체 페이지의 JDBC 실행 횟수</strong><br />인기순·조회순·최신순 모두 같은 결과입니다. 화살표는 이번 변경 전→후입니다.</caption>
      <thead><tr className="border-b border-gray-200 bg-gray-50"><th scope="col" className="px-1 py-3 font-semibold">반환 건수</th><th scope="col" className="px-1 py-3 font-semibold">같은 작성자</th><th scope="col" className="break-keep px-1 py-3 font-semibold">서로 다른 작성자</th></tr></thead>
      <tbody>{mysqlCounts.map(([size, before]) => <tr key={size} className="border-b border-gray-100"><th scope="row" className="px-1 py-3 font-medium">{size}건</th><td className="whitespace-nowrap px-1 py-3 tabular-nums">3→2회</td><td className="whitespace-nowrap px-1 py-3 font-semibold tabular-nums text-blue-800">{before}→2회</td></tr>)}</tbody>
    </table>
    <p className="text-sm leading-7 text-gray-600">마지막·빈 페이지는 별도입니다. 크기 100에서 서로 다른 작성자 5건이 남은 마지막 페이지는 6→1회, 다음 빈 페이지는 2→2회였습니다. EntityGraph가 모든 요청을 2회로 보장한다는 의미는 아닙니다.</p>
    <details className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <summary className="cursor-pointer rounded font-semibold leading-6 text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600">측정 조건과 검증 범위</summary>
      <div className="mt-4 space-y-4 text-sm leading-7 text-gray-600">
        <p><strong className="text-gray-900">실제 백엔드에서 수행한 로컬 MySQL 검증 기록</strong><br />2026-10-01에 남긴 기록을 요약했습니다. 회원 205명·프로젝트 210건 중 공개·비삭제 205건을 사용했습니다. 현재 페이지에서 서버를 실행하거나 재측정하지 않습니다.</p>
        <p><strong className="text-gray-900">같은 작성자와 다른 작성자를 나눈 이유</strong><br />한 호출 안에서는 같은 작성자를 1차 캐시에서 재사용합니다. 같은 작성자만으로 검사하면 작성자 수에 따라 늘어나는 SELECT를 드러내기 어렵습니다. 전후 모두 호출마다 새 영속성 컨텍스트를 사용하고 2차·쿼리 캐시는 껐습니다.</p>
        <p><strong className="text-gray-900">무엇을 세었나</strong><br />주 계측은 Controller 직접 호출→Service/JPA→DTO/JSON 직렬화까지의 실제 JDBC execute 횟수입니다. SQL 준비 횟수나 SQL 내부 Formula 서브쿼리 실행을 더한 수가 아닙니다. 158조건은 두 작성자 구성·세 정렬·페이지 크기와 경계 등의 비교 조건이며, 158개의 운영 HTTP 요청이나 테스트 메서드를 뜻하지 않습니다.</p>
        <p><strong className="text-gray-900">어떤 계약을 지켰나</strong><br />동일 158조건의 전체 응답 JSON과 공개·삭제 필터, 정렬, 자료형, NULL, 페이지 계약을 대조했습니다. 목록 조회 전후 21개 테이블의 행 fingerprint가 같아 업무 데이터·revision·outbox 불변을 확인했습니다. 관련 50테스트 통과 중 5개는 실제 MySQL을 사용하는 MockMvc 권한·상세·스냅샷 검사입니다. 나머지는 기존 H2·mock 기반 회귀이며, 주 SQL 계측은 별도 실행입니다. 50개 전체가 MySQL HTTP end-to-end 검사는 아닙니다.</p>
        <p><strong className="text-gray-900">이전 좋아요 조회 개선과의 구분</strong><br />이전 개인 개선은 중복 좋아요 COUNT 제거로, JPA/H2의 동일 3건 페이지에서 SQL 7→4회를 관측했습니다. 이번 MySQL 작성자 조회 개선과 조건·계측 방식이 다르므로 하나의 연속 측정으로 합치지 않습니다.</p>
        <p><strong className="text-gray-900">남은 비용</strong><br />작성자 별도 SELECT는 없어졌지만 목록 SQL 안의 회원 접근과 Formula 집계는 남아 있습니다. JDBC 횟수 감소를 응답시간 개선 배수나 모든 N+1 해결로 바꾸어 말하지 않습니다.</p>
      </div>
    </details>
  </div>;
}

export default function Process() {
  return <div className="mx-auto max-w-4xl space-y-8"><header className="py-6"><p className="text-sm font-bold tracking-widest text-blue-600">PERSONAL ENGINEERING NOTES</p><h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">개발 과정</h1><p className="mt-5 text-lg leading-relaxed text-gray-600">실패를 남기고, 다시 처리하고, 차이를 확인하는 과정.</p><p className="mt-4 leading-relaxed text-gray-600">ETCH는 2025년 팀 프로젝트로 시작했습니다. 기존 화면·API·검색 구현은 팀의 작업이며, 아래 outbox·증분 전달·검색 평가 체계·MySQL 목록 조회 개선은 이후 개인 고도화입니다.</p></header>
    <aside className="rounded-xl border border-blue-200 bg-blue-50 p-5 text-sm leading-relaxed text-blue-950"><strong>로컬에서 수행한 검증 기록</strong><p className="mt-2">복구 검증은 2026-09-29, 검색 기준선 활성화는 2026-09-30, MySQL 목록 검증은 2026-10-01에 남긴 로컬 기록입니다. 현재 페이지는 정적 설명이며 실시간 운영 지표가 아닙니다. 원본 로그·내부 주소·운영 자료는 이 정적 산출물에 포함하지 않습니다.</p></aside>
    {cases.map(item => <section key={item.n} aria-labelledby={`case-${item.n}`} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"><header className="border-b border-gray-100 p-6 sm:p-8"><span className="text-sm font-bold text-blue-600">CASE {item.n}</span><h2 id={`case-${item.n}`} className="mt-3 text-xl font-bold sm:text-2xl">{item.title}</h2><p className="mt-2 text-sm text-gray-500">{item.subtitle}</p></header><dl className="space-y-6 p-6 sm:p-8">{item.rows.map(([term, description]) => <div key={term} className="grid gap-2 sm:grid-cols-[5rem_1fr]"><dt className="font-bold text-gray-900">{term}</dt><dd className="text-sm leading-7 text-gray-600">{description}</dd></div>)}</dl>{item.n === "04" && <MysqlMeasurement />}<nav aria-label={`CASE ${item.n} 공개 근거`} className="border-t border-gray-100 p-6 sm:p-8"><p className="text-sm font-semibold text-gray-900">코드와 재현 자료 <span className="font-normal text-gray-500">· GitHub 새 탭</span></p><ul className="mt-3 flex flex-wrap gap-2">{item.sources.map(([label, path]) => <li key={path}><a href={`${sourceRoot}${path}`} target="_blank" rel="noopener noreferrer" className="inline-flex rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm leading-6 text-blue-800 underline decoration-blue-300 underline-offset-4 hover:bg-blue-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">{label}</a></li>)}</ul></nav></section>)}
    <aside className="rounded-xl bg-slate-100 p-5 text-sm leading-relaxed text-slate-600">이 화면은 가상 데이터 기반 정적 체험판이며 실제 백엔드는 외부 미배포 상태입니다. 보안 잔여 항목과 별도 자격증명 조치는 <a href={`${sourceRoot}SECURITY.md`} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">보안 안내<span className="sr-only"> (GitHub, 새 탭)</span></a>에서 확인할 수 있습니다.</aside>
    <Link to="/" className="showcase-secondary">← 화면 체험으로 돌아가기</Link>
  </div>;
}
