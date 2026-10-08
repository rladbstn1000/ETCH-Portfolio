import { Link } from "react-router";
import { DEMO_REFERENCE_DATE, DEMO_QUERIES } from "../../config/demo";

export default function DemoNotice({ examples = true }: { examples?: boolean }) {
  return <aside aria-label="데모 안내" className="my-5 rounded-xl border border-blue-100 bg-blue-50 p-4 sm:p-6 text-sm text-blue-950">
    <p className="font-semibold">합성 데이터로 체험하는 ETCH · 기준일 {DEMO_REFERENCE_DATE}</p>
    <p className="mt-2 leading-relaxed">회사·사용자·공고·뉴스·프로젝트는 모두 가상입니다. 실제 모집 공고나 기사가 아니며, 표시 날짜는 고정된 시연용 날짜입니다.</p>
    {examples && <div className="mt-4 flex flex-wrap items-center gap-2">
      <span>예시 검색</span>
      {DEMO_QUERIES.map(query => <Link key={query} to={`/search?q=${encodeURIComponent(query)}`} className="rounded-lg border border-blue-200 bg-white px-4 py-2 font-semibold hover:bg-blue-100">{query}</Link>)}
    </div>}
    <p className="mt-3 text-xs leading-relaxed">로그인 없이 검색과 공개 상세를 볼 수 있습니다. 로그인·개인 저장·추천·채팅·업로드는 이 데모에서 제공하지 않습니다.</p>
  </aside>;
}
