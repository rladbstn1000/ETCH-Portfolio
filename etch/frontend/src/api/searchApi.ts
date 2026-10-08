import { defaultInstance } from "./instances";
import type {
  SearchResponse,
  JobSearchResult,
  NewsSearchResult,
  ProjectSearchPage,
  Page,
  JobSearchFilters,
  NewsSearchFilters,
  ProjectSearchFilters,
} from "../types/search";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string | null;
}

// 통합 검색 (각 카테고리별로 제한된 개수)
export const searchAll = async (
  keyword?: string,
  page: number = 0,
  size: number = 4
): Promise<SearchResponse> => {
  const params = new URLSearchParams();
  if (keyword) params.append("keyword", keyword);
  params.append("page", page.toString());
  params.append("size", size.toString());

  const response = await defaultInstance.get<ApiResponse<SearchResponse>>(
    `/search?${params.toString()}`
  );
  return response.data.data;
};

// 채용 검색
export const searchJobs = async (
  filters: JobSearchFilters
): Promise<Page<JobSearchResult>> => {
  const params = new URLSearchParams();

  if (filters.keyword) params.append("keyword", filters.keyword);
  if (filters.regions) {
    filters.regions.forEach((region) => params.append("regions", region));
  }
  if (filters.jobCategories) {
    filters.jobCategories.forEach((category) =>
      params.append("jobCategories", category)
    );
  }
  if (filters.workType) params.append("workType", filters.workType);
  if (filters.educationLevel)
    params.append("educationLevel", filters.educationLevel);

  params.append("page", (filters.page ?? 0).toString());
  params.append("size", (filters.size ?? 10).toString());

  const response = await defaultInstance.get<
    ApiResponse<Page<JobSearchResult>>
  >(`/jobs/search?${params.toString()}`);
  return response.data.data;
};

// 뉴스 검색
export const searchNews = async (
  filters: NewsSearchFilters
): Promise<Page<NewsSearchResult>> => {
  const params = new URLSearchParams();

  if (filters.keyword) params.append("keyword", filters.keyword);
  params.append("page", (filters.page ?? 0).toString());
  params.append("size", (filters.size ?? 10).toString());

  const response = await defaultInstance.get<
    ApiResponse<Page<NewsSearchResult>>
  >(`/news/search?${params.toString()}`);
  return response.data.data;
};

// 프로젝트 검색
export const searchProjects = async (
  filters: ProjectSearchFilters
): Promise<ProjectSearchPage> => {
  const params = new URLSearchParams();

  if (filters.keyword) params.append("keyword", filters.keyword);
  if (filters.category) params.append("category", filters.category);
  if (filters.sort) params.append("sort", filters.sort);

  params.append("page", (filters.page ?? 0).toString());
  params.append("size", (filters.size ?? 12).toString());

  const response = await defaultInstance.get<
    ApiResponse<ProjectSearchPage>
  >(`/projects/search?${params.toString()}`);
  return response.data.data;
};
