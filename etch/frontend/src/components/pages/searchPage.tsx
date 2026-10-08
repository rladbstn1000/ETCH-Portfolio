import { DEMO_MODE } from "../../config/demo";
import DemoNotice from "../common/demoNotice";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { searchAll, searchJobs, searchNews, searchProjects } from "../../api/searchApi";
import type { JobSearchResult, NewsSearchResult, Page, ProjectSearchPage, ProjectSearchResult, SearchResponse } from "../../types/search";
import type { JobItemProps } from "../atoms/listItem";
import type { ProjectData } from "../../types/project/projectDatas";
import { useLikedNews } from "../../hooks/useLikedItems";
import { useSearchRequest } from "../../hooks/useSearchRequest";
import type { SearchStatus } from "../../hooks/useSearchRequest";
import JobDetailModal from "../organisms/job/jobDetailModal";
import SearchJobList from "../organisms/job/searchJobList";
import NewsCard from "../molecules/home/newsCard";
import Pagination from "../common/pagination";
import ProjectListCard from "../organisms/project/list/projectListCard";

type SearchTab = "all" | "jobs" | "news" | "projects";

function SearchFeedback({ status, retry }: { status: SearchStatus; retry: () => void }) {
  if (status === "idle" || status === "loading") {
    return <div role="status" className="flex items-center justify-center gap-3 h-48 text-gray-600">
      <div aria-hidden="true" className="w-8 h-8 border-4 border-blue-200 rounded-full border-t-blue-600 animate-spin" />
      검색 중입니다
    </div>;
  }
  if (["error", "invalid", "limited", "unavailable"].includes(status)) {
    return <div role="alert" className="flex flex-col items-center justify-center gap-4 h-48 text-gray-700">
      <p>{status === "invalid" ? "검색 조건이 올바르지 않습니다. 검색어와 필터를 확인해 주세요."
        : status === "limited" ? "요청이 많습니다. 잠시 기다린 뒤 다시 시도해 주세요."
        : status === "unavailable" ? "검색 서비스에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요."
        : "검색에 실패했습니다. 잠시 후 다시 시도해 주세요."}</p>
      <button type="button" onClick={retry} className="px-4 py-2 text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100">다시 시도</button>
    </div>;
  }
  return null;
}

function EmptyResults({ hasNext = false, laterPage = false }: { hasNext?: boolean; laterPage?: boolean }) {
  return <div className="flex items-center justify-center h-24 text-gray-500">
    {hasNext
      ? "이 구간의 공개 결과가 없습니다. 다음 결과를 확인해 주세요."
      : laterPage ? "이 구간의 공개 결과가 없습니다." : "검색 결과가 없습니다"}
  </div>;
}

function ResultSection({ title, more, children }: { title: string; more: () => void; children: ReactNode }) {
  return <section>
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      <button onClick={more} className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100">더보기</button>
    </div>
    <div className="p-6 bg-white border-gray-200 rounded-lg shadow-sm">{children}</div>
  </section>;
}

const convertJob = (job: JobSearchResult): JobItemProps => ({ ...job, id: job.id.toString(), companyId: 0 });
const convertProject = (project: ProjectSearchResult): ProjectData => ({
  id: project.projectId, title: project.title, nickname: project.memberName,
  thumbnailUrl: project.thumbnailUrl ?? "", likeCount: project.likeCount, viewCount: project.viewCount,
  content: "", youtubeUrl: "", projectCategory: "", createdAt: "", updatedAt: "",
  isDeleted: false, githubUrl: "", isPublic: true, likedByMe: false, member: { id: 0, nickname: project.memberName },
});

function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  // 검색어별 탭/페이지/모달을 초기화하고 이전 검색의 지연 응답을 분리한다.
  return <SearchResultsPage key={`${query}|${searchParams.get("region") || ""}|${searchParams.get("category") || ""}`} query={query} />;
}

function SearchResultsPage({ query }: { query: string }) {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const requestedTab = params.get("tab");
  const activeTab: SearchTab = requestedTab === "jobs" || requestedTab === "news" || requestedTab === "projects" ? requestedTab : "all";
  const setActiveTab = (tab: SearchTab) => { const next = new URLSearchParams(params); next.set("tab", tab); setParams(next); };
  const region = params.get("region") || "";
  const category = params.get("category") || "";
  const applyFilters = (nextRegion: string, nextCategory: string) => {
    const next = new URLSearchParams(params); next.set("tab", "jobs");
    if (nextRegion) next.set("region", nextRegion); else next.delete("region");
    if (nextCategory) next.set("category", nextCategory); else next.delete("category");
    setParams(next);
  };
  const [searchInput, setSearchInput] = useState(query);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [jobPage, setJobPage] = useState(0);
  const [newsPage, setNewsPage] = useState(0);
  const [projectPage, setProjectPage] = useState(0);
  const all = useSearchRequest<SearchResponse>();
  const jobs = useSearchRequest<Page<JobSearchResult>>();
  const news = useSearchRequest<Page<NewsSearchResult>>();
  const projects = useSearchRequest<ProjectSearchPage>();
  const { isNewsLiked, addLikedNews, removeLikedNews } = useLikedNews();
  const hasQuery = Boolean(query.trim());

  const loadAll = () => all.run(() => searchAll(query, 0, 4));
  const loadJobs = (page = jobPage) => { setJobPage(page); return jobs.run(() => searchJobs({ keyword: query, page, size: 9, ...(region ? { regions: [region] } : {}), ...(category ? { jobCategories: [category] } : {}) })); };
  const loadNews = (page = newsPage) => { setNewsPage(page); return news.run(() => searchNews({ keyword: query, page, size: 10 })); };
  const loadProjects = (page = projectPage) => { setProjectPage(page); return projects.run(() => searchProjects({ keyword: query, page, size: 8 })); };

  useEffect(() => { if (hasQuery) void loadAll(); }, [query]);
  useEffect(() => {
    if (!hasQuery) return;
    if (activeTab === "jobs" && jobs.status === "idle") void loadJobs(0);
    if (activeTab === "news" && news.status === "idle") void loadNews(0);
    if (activeTab === "projects" && projects.status === "idle") void loadProjects(0);
  }, [activeTab, query]);

  const renderJobs = (items: JobSearchResult[], detailed = false) => items.length
    ? <SearchJobList jobs={items.map(convertJob)} onJobClick={id => setSelectedJobId(Number(id))}
      maxItems={items.length} gridCols={detailed ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 md:grid-cols-2"} />
    : <EmptyResults />;
  const renderNews = (items: NewsSearchResult[]) => items.length
    ? <div className="space-y-3">{items.map(item => <NewsCard key={item.id} id={item.id} title={item.title}
      url={item.link} publishedAt={item.publishedAt} description={item.summary} companyName={item.companyName}
      type="news" isLiked={isNewsLiked(item.id)} onLikeStateChange={(id, liked) => liked ? addLikedNews(id) : removeLikedNews(id)} />)}</div>
    : <EmptyResults />;
  const renderProjects = (result: ProjectSearchPage, refresh: () => void) => result.content.length
    ? <ProjectListCard projects={result.content.map(convertProject)} onProjectUpdate={refresh} />
    : <EmptyResults hasNext={result.page.hasNext} laterPage={result.page.number > 0} />;

  const selectedJob = (activeTab === "jobs" ? jobs.data?.content : all.data?.jobs.content)?.find(job => job.id === selectedJobId);
  // 프로젝트 총건수가 미집계이므로 전체 합계도 표시하지 않는다. 요청 실패/중에는 지난 건수를 재사용하지 않는다.
  const tabCounts = {
    all: null,
    jobs: activeTab === "jobs" ? jobs.data?.page.totalElements : all.data?.jobs.page.totalElements,
    news: activeTab === "news" ? news.data?.page.totalElements : all.data?.news.page.totalElements,
    projects: hasQuery ? "건수 미집계" : null,
  };
  const tabs: { id: SearchTab; label: string }[] = [
    { id: "all", label: "전체" }, { id: "jobs", label: "채용" }, { id: "news", label: "뉴스" }, { id: "projects", label: "프로젝트" },
  ];

  return <div className="min-h-screen">
    {DEMO_MODE && <DemoNotice />}
    <div className="px-6 py-6 mx-auto text-center max-w-7xl">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">통합 검색</h1>
      {hasQuery && <p className="text-gray-600">'{query}'에 대한 검색 결과입니다</p>}
    </div>
    <div className="border-b border-gray-200">
      <form className="relative max-w-2xl my-4 mx-auto" onSubmit={event => {
        event.preventDefault();
        if (searchInput.trim()) navigate(`/search?q=${encodeURIComponent(searchInput.trim())}`);
      }}>
        <input type="text" value={searchInput} onChange={event => setSearchInput(event.target.value)}
          placeholder="검색어를 입력하세요" aria-label="검색어"
          className="w-full px-4 py-3 pr-12 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <button type="submit" aria-label="검색" className="absolute text-gray-500 transform -translate-y-1/2 right-3 top-1/2 hover:text-blue-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </form>
    </div>
    <div className="bg-white border-b border-gray-100 shadow-sm">
      <div className="flex flex-wrap gap-1 px-1 sm:px-6 mx-auto max-w-7xl">
        {tabs.map(tab => <button key={tab.id} onClick={() => setActiveTab(tab.id)} aria-pressed={activeTab === tab.id}
          className={`relative px-3 sm:px-6 py-3 font-semibold transition-all duration-300 transform ${activeTab === tab.id
            ? "text-white bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg scale-105 -mb-px"
            : "text-gray-600 bg-gray-50 hover:text-gray-800 hover:bg-gray-100 hover:scale-102"}`}>
          {tab.label}{tabCounts[tab.id] != null && <span className={`ml-2 px-2 py-0.5 text-xs font-bold rounded-full ${activeTab === tab.id ? "bg-white/20 text-white" : "bg-blue-100 text-blue-600"}`}>{tabCounts[tab.id]}</span>}
          {activeTab === tab.id && <div className="absolute bottom-0 w-4 h-1 transform -translate-x-1/2 bg-white rounded-t-full left-1/2" />}
        </button>)}
      </div>
    </div>
    <main className="px-1 sm:px-6 py-8 mx-auto max-w-7xl">
      {!hasQuery ? <p className="text-center text-gray-600">검색어를 입력해 주세요.</p> : <>
        {activeTab === "all" && <>
          <SearchFeedback status={all.status} retry={loadAll} />
          {all.data && <div className="space-y-12">
            <ResultSection title={`채용 (${all.data.jobs.page.totalElements})`} more={() => setActiveTab("jobs")}>{renderJobs(all.data.jobs.content)}</ResultSection>
            <ResultSection title={`뉴스 (${all.data.news.page.totalElements})`} more={() => setActiveTab("news")}>{renderNews(all.data.news.content)}</ResultSection>
            <ResultSection title="프로젝트 (건수 미집계)" more={() => setActiveTab("projects")}>
              {renderProjects(all.data.projects, loadAll)}
              <p className="mt-4 text-sm text-gray-500">공개 상태를 확인한 결과만 표시하며 전체 건수는 집계하지 않습니다.</p>
            </ResultSection>
          </div>}
        </>}
        {activeTab === "jobs" && <div className="space-y-6">
          <div className="flex flex-wrap items-end gap-3 rounded-lg bg-white p-4">
            <label className="text-sm font-medium">지역<select aria-label="채용 지역" value={region} onChange={event => applyFilters(event.target.value, category)} className="mt-1 block rounded border border-gray-300 bg-white p-2">
              <option value="">전체 지역</option>{["서울", "경기", "부산", "대전"].map(item => <option key={item}>{item}</option>)}
            </select></label>
            <label className="text-sm font-medium">직무<select aria-label="채용 직무" value={category} onChange={event => applyFilters(region, event.target.value)} className="mt-1 block rounded border border-gray-300 bg-white p-2">
              <option value="">전체 직무</option>{["백엔드", "프론트엔드", "데이터엔지니어", "데이터분석가", "DevOps/클라우드", "보안", "앱개발", "교육운영", "웹디자인", "기획", "마케팅", "게임개발", "총무"].map(item => <option key={item}>{item}</option>)}
            </select></label>
            <button type="button" onClick={() => applyFilters("", "")} className="rounded border border-gray-300 px-3 py-2 text-sm">필터 해제</button>
            <p className="w-full text-xs text-gray-600">등록된 지역·직무와 정확히 일치하는 공고를 찾습니다. 채용과 뉴스는 현재 검색 관련도순, 프로젝트는 최신 작성순입니다.</p>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">채용 검색 결과{jobs.data ? ` (${jobs.data.page.totalElements}개)` : ""}</h2>
          <div className="bg-white rounded-lg shadow-sm">
            <SearchFeedback status={jobs.status} retry={() => void loadJobs()} />
            {jobs.data && renderJobs(jobs.data.content, true)}
          </div>
          {jobs.data && jobs.data.page.totalPages > 1 && <Pagination currentPage={jobPage + 1}
            totalPages={jobs.data.page.totalPages} totalElements={jobs.data.page.totalElements}
            isLast={jobPage + 1 >= jobs.data.page.totalPages} onPageChange={page => void loadJobs(page - 1)} itemsPerPage={9} />}
        </div>}
        {activeTab === "news" && <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">뉴스 검색 결과{news.data ? ` (${news.data.page.totalElements}개)` : ""}</h2>
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <SearchFeedback status={news.status} retry={() => void loadNews()} />
            {news.data && renderNews(news.data.content)}
          </div>
          {news.data && news.data.page.totalPages > 1 && <Pagination currentPage={newsPage + 1}
            totalPages={news.data.page.totalPages} totalElements={news.data.page.totalElements}
            isLast={newsPage + 1 >= news.data.page.totalPages} onPageChange={page => void loadNews(page - 1)} itemsPerPage={10} />}
        </div>}
        {activeTab === "projects" && <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">프로젝트 검색 결과 (건수 미집계)</h2>
          <p className="text-sm text-gray-500">공개 상태를 확인한 결과만 표시하며 전체 건수는 집계하지 않습니다. 다음 구간에 공개 결과가 없을 수도 있습니다.</p>
          <div className="p-4 bg-white rounded-lg shadow-sm">
            <SearchFeedback status={projects.status} retry={() => void loadProjects()} />
            {projects.data && renderProjects(projects.data, () => void loadProjects())}
          </div>
          {projects.data && (projects.data.page.hasPrevious || projects.data.page.hasNext) && <nav aria-label="프로젝트 검색 구간" className="flex items-center justify-center gap-4">
            <button className="px-4 py-2 bg-gray-100 rounded-lg disabled:opacity-40" disabled={!projects.data.page.hasPrevious}
              onClick={() => void loadProjects(projects.data!.page.number - 1)}>이전 결과</button>
            <span>{projects.data.page.number + 1}번째 구간</span>
            <button className="px-4 py-2 bg-gray-100 rounded-lg disabled:opacity-40" disabled={!projects.data.page.hasNext || projects.data.page.nextPage == null}
              onClick={() => void loadProjects(projects.data!.page.nextPage!)}>다음 결과</button>
          </nav>}
        </div>}
      </>}
    </main>
    {selectedJob && <JobDetailModal job={convertJob(selectedJob)} onClose={() => setSelectedJobId(null)} />}
  </div>;
}

export default SearchPage;
