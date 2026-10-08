import { createBrowserRouter, Link, Outlet } from "react-router";
import Layout from "./Layout";
import Home from "./Home";
import Process from "./Process";
import { createShowcaseRouterWindow } from "./routerWindow";
import { initialJobs } from "./data";
import SearchPage from "../components/pages/searchPage";
import JobPage from "../components/pages/job/jobPage";
import NewsPage from "../components/pages/news/newsMainPage";
import NewsLatestPage from "../components/pages/news/newsLatestPage";
import ProjectListPage from "../components/pages/project/projectListPage";
import MyPageLayout from "../layout/mypageLayout";
import FavoritePage from "../components/pages/mypage/mypageFavoritePage";
import FavoriteProjects from "../components/pages/mypage/favorite/detailFavoriteProject";
import ApplicationsPage from "../components/pages/mypage/mypageApplicationsPage";
import { ShowcaseDashboard, CoverLettersPage, CoverLetterDetailPage, CoverLetterEditPage, PortfolioPage, MyProjectsPage, ChatPreviewPage, ConnectionsPreviewPage, ProjectEditorPreviewPage } from "./PersonalPages";

function PersonalLayout() {
  return <><nav aria-label="개인 예시 화면" className="mb-6 flex flex-wrap gap-2 text-sm">{[["/mypage", "대시보드"], ["/mypage/coverletters", "자기소개서"], ["/mypage/portfolios", "포트폴리오"], ["/mypage/favorites", "스크랩"], ["/mypage/applications", "지원 현황"], ["/chat", "예시 채팅"]].map(([path, label]) => <Link key={path} to={path} className="rounded-lg border border-gray-200 bg-white px-3 py-2 hover:border-blue-300">{label}</Link>)}</nav><MyPageLayout /></>;
}
const jobFilterOptions = {
  regions: [...new Set(initialJobs.flatMap(job => job.regions))],
  industries: [...new Set(initialJobs.flatMap(job => job.industries))],
  jobCategories: [...new Set(initialJobs.flatMap(job => job.jobCategories))],
  workTypes: [...new Set(initialJobs.map(job => job.workType))],
  educationLevels: [...new Set(initialJobs.map(job => job.educationLevel))],
};
function Jobs() { return <JobPage initialDate={new Date("2026-09-01T12:00:00")} filterOptions={jobFilterOptions} />; }
function News() { return <><p className="mb-4 text-sm text-gray-600">기준일의 가상 기사 목록입니다. 자동 수집·실시간 갱신은 실행하지 않습니다.</p><NewsPage /></>; }
function Applications() { return <><p className="mb-4 rounded-lg bg-blue-50 p-4 text-sm text-blue-900">지원 현황은 가상의 진행 기록입니다. 상태 변경·삭제는 메모리에서만 체험하며 기업에 지원서를 제출하지 않습니다.</p><ApplicationsPage /></>; }
function Unavailable() { return <section className="rounded-2xl border border-gray-200 bg-white p-8"><h1 className="text-2xl font-bold">이 화면은 체험 범위 밖입니다</h1><p className="my-5 text-gray-600">실제 로그인·계정 설정·업로드는 연결하지 않았습니다. 개인정보 입력 없이 가상 사용자 화면을 볼 수 있습니다.</p><Link to="/mypage" className="showcase-primary">가상 마이페이지</Link><Link to="/" className="ml-4 text-blue-700 underline">홈으로</Link></section>; }

export default createBrowserRouter([{ path: "/", Component: Layout, errorElement: <Unavailable />, children: [
  { index: true, Component: Home }, { path: "process", Component: Process },
  { path: "search", Component: SearchPage }, { path: "jobs", Component: Jobs },
  { path: "news", Component: News }, { path: "news/latest", Component: NewsLatestPage },
  { path: "projects", Component: ProjectListPage },
  { path: "projects/write", Component: ProjectEditorPreviewPage },
  { path: "projects/:id/edit", Component: ProjectEditorPreviewPage },
  { path: "members/:userId/projects", Component: MyProjectsPage },
  { path: "chat", Component: ChatPreviewPage },
  { path: "mypage", Component: PersonalLayout, children: [
    { index: true, Component: ShowcaseDashboard },
    { path: "applications", Component: Applications }, { path: "favorites", Component: FavoritePage },
    { path: "favorites/projects", Component: FavoriteProjects },
    { path: "projects", Component: MyProjectsPage },
    { path: "coverletters", Component: CoverLettersPage },
    { path: "cover-letter-detail/:id", Component: CoverLetterDetailPage },
    { path: "cover-letter-edit/:id", Component: CoverLetterEditPage },
    { path: "portfolios", Component: Outlet, children: [{ index: true, Component: PortfolioPage }, { path: ":userId", Component: PortfolioPage }, { path: "edit/:id", Component: PortfolioPage }] },
    { path: "followers", Component: ConnectionsPreviewPage }, { path: "following", Component: ConnectionsPreviewPage },
  ] },
  { path: "*", Component: Unavailable },
] }], { window: createShowcaseRouterWindow(window) });
