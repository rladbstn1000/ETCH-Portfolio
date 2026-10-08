import { DEMO_MODE, demoSearchPath } from "../../config/demo";
import { Link, useLocation } from "react-router";
import HeaderSearch from "../organisms/header/headerSearch";
import LogoImg from "../../assets/logo.webp";
import HeaderAuth from "../organisms/header/headerAuth";

function Header() {
  const location = useLocation();

  const isActive = (path: string) => {
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  const navLinkClass = (path: string) => {
    const baseClass =
      "relative px-4 py-2 text-sm font-semibold transition-all duration-200 group md:text-base tracking-tight";
    const activeClass = "text-blue-600";
    const inactiveClass = "text-gray-600 hover:text-blue-600";

    return `${baseClass} ${isActive(path) ? activeClass : inactiveClass}`;
  };

  return (
    <header className="bg-white">
      <div className="flex flex-col items-center justify-between gap-6 xl:flex-row xl:gap-8">
        {/* 왼쪽: 로고 + 네비게이션 */}
        <div className="flex flex-col items-center gap-6 xl:flex-row xl:gap-8">
          {/* 로고 */}
          <Link
            to={"/"}
            className="transition-transform duration-200 hover:scale-105"
          >
            <img 
              src={LogoImg} 
              alt="ETCH 로고" 
              className="w-36 md:w-40" 
              width={144}
              height={52}
            />
          </Link>

          {/* 네비게이션 메뉴 */}
          <nav className="flex items-center gap-2 md:gap-4">
            <Link to={DEMO_MODE ? demoSearchPath("jobs") : "/jobs"} className={navLinkClass("/jobs")}>
              채용공고
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-200 group-hover:w-full"></span>
            </Link>
            <Link to={DEMO_MODE ? demoSearchPath("news") : "/news"} className={navLinkClass("/news")}>
              뉴스
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-200 group-hover:w-full"></span>
            </Link>
            <Link to={DEMO_MODE ? demoSearchPath("projects") : "/projects"} className={navLinkClass("/projects")}>
              프로젝트
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-200 group-hover:w-full"></span>
            </Link>
          </nav>
        </div>

        {/* 오른쪽: 검색 + 인증 */}
        <div className="flex flex-col items-center w-full gap-4 xl:flex-row xl:w-auto xl:gap-6">
          <HeaderSearch />
          {DEMO_MODE ? <span className="whitespace-nowrap rounded-full bg-blue-50 px-3 py-2 text-xs text-blue-700">로그인 없는 데모</span> : <HeaderAuth />}
        </div>
      </div>
    </header>
  );
}

export default Header;
