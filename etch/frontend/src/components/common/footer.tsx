import { DEMO_MODE, demoSearchPath } from "../../config/demo";
import { Link } from "react-router";
import logo from "../../assets/logo.webp";

function Footer() {
  return (
    <footer className="bg-white">
      <div className="px-6 py-8 mx-auto max-w-screen-2xl sm:px-8 lg:px-12 xl:px-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center justify-center mb-4 md:justify-start">
              <img
                src={logo}
                alt="로고"
                className="w-36 md:w-40"
                width={144}
                height={52}
              />
            </div>
            <p className="text-sm text-center text-gray-600 md:text-left">
              {DEMO_MODE ? "팀 프로젝트 ETCH의 검색·동기화 개인 고도화 데모입니다." : "IT 취업 준비를 위한 모든 것을 한 곳에서 제공하는 플랫폼입니다."}
            </p>
          </div>
          <div>
            <h3 className="mb-4 font-semibold text-center md:text-left">
              서비스
            </h3>
            <ul className="space-y-2 text-sm text-center text-gray-600 md:text-left">
              <li>
                <Link to={DEMO_MODE ? demoSearchPath("jobs") : "/jobs"}>
                  <span className="text-gray-600">채용공고</span>
                </Link>
              </li>
              <li>
                <Link to={DEMO_MODE ? demoSearchPath("news") : "/news"}>
                  <span className="text-gray-600">뉴스</span>
                </Link>
              </li>
              <li>
                <Link to={DEMO_MODE ? demoSearchPath("projects") : "/projects"}>
                  <span className="text-gray-600">프로젝트</span>
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 font-semibold text-center md:text-left">
              {DEMO_MODE ? "데모 범위" : "문의하기"}
            </h3>
            <ul className="space-y-2 text-sm text-center text-gray-600 md:text-left">
              <li>{DEMO_MODE ? "가상 자료의 공개 검색·조회만 제공합니다." : "이메일: team@example.invalid"}</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center mt-8 md:flex-row md:justify-between">
          <p className="mb-2 text-sm text-center text-gray-600 md:text-left md:mb-0">
            © 2025 ETCH. All rights reserved.
          </p>
          <p className="text-xs text-center text-gray-500 md:text-left">
            Developer: SeungSu, JaeBin, HyunJi, SungHyun, YoonSu, SungMin
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
