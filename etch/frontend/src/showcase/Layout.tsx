import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router";
import { ModalProvider } from "../contexts/modalContext";
import { resetShowcase } from "./state";
import { datasetVersion, referenceDate } from "./data";
import logo from "../assets/public/etch.svg";
import "./showcase.css";

export default function Layout() {
  const [reset, setReset] = useState(0);
  const [notice, setNotice] = useState("");
  const location = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);
  return <div className="showcase-shell min-h-screen bg-gray-50 text-gray-900">
    <a href="#content" className="skip-link">본문으로 이동</a>
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4">
        <Link to="/" aria-label="ETCH 홈" className="flex items-center gap-3"><img src={logo} alt="ETCH" width="94" height="38" /><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">화면 체험판</span></Link>
        <nav aria-label="주 메뉴" className="flex flex-wrap gap-1 text-sm font-semibold">
          {[["/search?q=React", "검색"], ["/jobs", "채용"], ["/news", "뉴스"], ["/projects", "프로젝트"], ["/mypage", "가상 마이페이지"], ["/process", "개발 과정"]].map(([to, label]) => <NavLink key={to} to={to} className={({ isActive }) => `rounded-lg px-3 py-2 ${isActive ? "bg-blue-50 text-blue-700" : "hover:bg-gray-100"}`}>{label}</NavLink>)}
          <a href="https://github.com/rladbstn1000/ETCH-Portfolio" target="_blank" rel="noopener noreferrer" className="rounded-lg px-3 py-2 text-blue-700 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">소스 코드<span className="sr-only"> (GitHub, 새 탭)</span></a>
        </nav>
      </div>
    </header>
    <aside aria-label="화면 체험판 안내" className="border-b border-blue-100 bg-blue-50">
      <div className="mx-auto max-w-7xl px-5 py-4 text-sm leading-relaxed text-blue-950">
        <p className="font-semibold">예시 데이터로 구성된 화면 체험판입니다. 실제 로그인, 지원서 제출, 메시지 전송은 수행하지 않습니다.</p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          <p>가상 사용자 · {datasetVersion} · 기준일 {referenceDate} · 편집·스크랩은 이 탭의 메모리에만 남고 새로고침하면 초기화됩니다.</p>
          <button className="rounded-md border border-blue-200 bg-white px-3 py-2 font-semibold" onClick={() => { resetShowcase(); setReset(value => value + 1); setNotice("예시 상태를 처음으로 되돌렸습니다."); }}>예시 초기화</button>
        </div>
        <p role="status" className="mt-1">{notice}</p>
      </div>
    </aside>
    <main id="content" tabIndex={-1} className="mx-auto max-w-7xl px-4 py-7 sm:px-6">
      <ModalProvider key={reset}><Outlet /></ModalProvider>
    </main>
    <footer className="mt-12 border-t border-gray-200 bg-white px-5 py-8 text-center text-sm text-gray-500">
      <p>ETCH Team © 2025 · 팀의 화면과 서비스 구현 위에 개인 검색·동기화 개선을 기록했습니다.</p>
      <p className="mt-2"><Link to="/process" className="text-blue-700 underline">실제 구현과 검증 이야기</Link> · 화면 체험 검색은 예시 문자열 검색이며 Elasticsearch 평가가 아닙니다.</p>
      <p className="mt-2"><a href="/licenses.html" className="text-blue-700 underline">저작권·오픈소스 고지</a></p>
    </footer>
  </div>;
}
