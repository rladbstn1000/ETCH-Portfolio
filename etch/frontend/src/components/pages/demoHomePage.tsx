import { Link } from "react-router";
import DemoNotice from "../common/demoNotice";

// 4차 데모 홈을 공유하고 운영 홈 이미지와 API 의존성을 공개 번들에서 분리한다.
export default function DemoHomePage() {
  return <div className="min-h-screen">
    <section className="rounded-2xl bg-gradient-to-br from-[#007DFC] to-[#0056CC] px-6 py-14 sm:px-12 sm:py-20 text-white">
      <p className="mb-4 text-sm font-semibold tracking-wider">ETCH · LOCAL DEMO</p>
      <h1 className="max-w-3xl text-3xl font-bold leading-tight sm:text-5xl">채용, 뉴스, 프로젝트를<br />한 곳에서 탐색하세요</h1>
      <p className="mt-6 max-w-2xl text-base leading-relaxed text-blue-50 sm:text-lg">관심 있는 기술과 주제로 검색하고, 유형과 필터를 바꿔 가며 가상의 자료를 살펴보세요.</p>
      <Link to="/search" className="mt-8 inline-flex rounded-xl bg-white px-7 py-3 text-lg font-bold text-blue-700 shadow-md hover:bg-blue-50">데모 체험하기</Link>
      <p className="mt-4 text-sm text-blue-50">로그인 없이 시작 · 합성 데이터 기반 로컬 데모</p>
    </section>
    <DemoNotice />
    <section className="grid gap-4 sm:grid-cols-3" aria-label="데모 탐색 순서">
      {[['01', '관심 키워드 검색', 'Spring, React, 검색 중 하나로 시작하거나 직접 입력하세요.'], ['02', '유형과 조건 선택', '채용·뉴스·프로젝트를 전환하고 채용 지역·직무를 좁혀 보세요.'], ['03', '공개 내용 확인', '채용 상세, 뉴스 요약, 공개 프로젝트를 확인하세요.']].map(([step,title,body]) => <article key={step} className="rounded-xl border border-gray-200 bg-white p-6"><span className="text-sm font-bold text-blue-600">{step}</span><h2 className="mt-3 text-lg font-semibold">{title}</h2><p className="mt-2 text-sm leading-relaxed text-gray-600">{body}</p></article>)}
    </section>
  </div>;
}
