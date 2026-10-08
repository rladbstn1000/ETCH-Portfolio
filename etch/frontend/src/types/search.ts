// 페이지네이션 정보 인터페이스
export interface PageInfo {
  size: number;
  number: number;
  totalElements: number;
  totalPages: number;
}

// 페이지네이션 인터페이스
export interface Page<T> {
  content: T[];
  page: PageInfo;
}

// 채용 검색 결과
export interface JobSearchResult {
  id: number;
  title: string;
  companyName: string;
  industries: string[];
  regions: string[];
  jobCategories: string[];
  workType: string;
  educationLevel: string;
  openingDate: string;
  expirationDate: string;
}

// 뉴스 검색 결과
export interface NewsSearchResult {
  id: number;
  title: string;
  summary: string;
  companyName: string;
  link: string;
  thumbnailUrl?: string;
  publishedAt: string;
}

// 프로젝트 검색 결과
export interface ProjectSearchResult {
  projectId: number;
  title: string;
  memberName: string;
  thumbnailUrl: string | null;
  likeCount: number;
  viewCount: number;
}

// DB 공개 범위 검증 후 ES 후보를 제외하므로 정확한 전체 공개 건수는 미집계한다.
// hasNext는 다음 ES 후보 구간의 존재 여부이며 content가 비어도 true일 수 있다.
export interface ProjectSearchPage {
  content: ProjectSearchResult[];
  page: {
    number: number;
    size: number;
    totalElements: null;
    totalPages: null;
    totalExact: false;
    hasNext: boolean;
    hasPrevious: boolean;
    nextPage: number | null;
  };
}

// 통합 검색 응답
export interface SearchResponse {
  jobs: Page<JobSearchResult>;
  news: Page<NewsSearchResult>;
  projects: ProjectSearchPage;
}

// 검색 필터 (채용)
export interface JobSearchFilters {
  keyword?: string;
  regions?: string[];
  jobCategories?: string[];
  workType?: string;
  educationLevel?: string;
  page?: number;
  size?: number;
}

// 검색 필터 (뉴스)
export interface NewsSearchFilters {
  keyword?: string;
  page?: number;
  size?: number;
}

// 검색 필터 (프로젝트)
export interface ProjectSearchFilters {
  keyword?: string;
  category?: string;
  sort?: "LATEST" | "POPULAR";
  page?: number;
  size?: number;
}
