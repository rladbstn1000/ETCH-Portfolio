import type { JobSearchFilters, NewsSearchFilters, ProjectSearchFilters, SearchResponse, Page, ProjectSearchPage } from '../../types/search';
import { showcaseState, copy } from '../state';

// 단순 문자열 포함 검색. 서버 ES/Nori/BM25 평가의 재현이나 대체가 아니다.
export const includesText = (keyword: string | undefined, ...fields: (string | undefined)[]) => {
  const query = (keyword ?? '').trim().toLocaleLowerCase();
  return !query || fields.join(' ').toLocaleLowerCase().includes(query);
};
export function paginate<T>(items: T[], page = 0, size = 10): Page<T> {
  const number = Math.max(0, Math.floor(page));
  const limit = Math.max(1, Math.min(100, Math.floor(size)));
  return { content: copy(items.slice(number * limit, (number + 1) * limit)), page: { number, size: limit, totalElements: items.length, totalPages: Math.ceil(items.length / limit) } };
}
export async function searchJobs(filters: JobSearchFilters) {
  const jobs = showcaseState.jobs.filter(job => includesText(filters.keyword, job.title, job.companyName, ...job.jobCategories)
    && (!filters.regions?.length || filters.regions.some(region => job.regions.includes(region)))
    && (!filters.jobCategories?.length || filters.jobCategories.some(category => job.jobCategories.includes(category)))
    && (!filters.workType || job.workType === filters.workType)
    && (!filters.educationLevel || job.educationLevel === filters.educationLevel));
  return paginate(jobs, filters.page, filters.size);
}
export async function searchNews(filters: NewsSearchFilters) {
  const news = showcaseState.news.filter(item => includesText(filters.keyword, item.title, item.description, item.company?.name)).map(item => ({
    id: item.id, title: item.title, summary: item.description ?? '', companyName: item.company?.name ?? '', link: '', thumbnailUrl: item.thumbnailUrl, publishedAt: item.publishedAt,
  }));
  return paginate(news, filters.page, filters.size);
}
export async function searchProjects(filters: ProjectSearchFilters): Promise<ProjectSearchPage> {
  const projects = showcaseState.projects.filter(item => includesText(filters.keyword, item.title, item.content, ...item.techCodes ?? [])
    && (!filters.category || item.projectCategory === filters.category)).sort((left, right) => filters.sort === 'POPULAR' ? right.likeCount - left.likeCount || right.id - left.id : right.id - left.id);
  const page = paginate(projects, filters.page, filters.size ?? 12);
  const hasNext = page.page.number + 1 < page.page.totalPages;
  return {
    content: page.content.map(item => ({ projectId: item.id, title: item.title, memberName: item.nickname, thumbnailUrl: item.thumbnailUrl, likeCount: item.likeCount, viewCount: item.viewCount })),
    page: { number: page.page.number, size: page.page.size, totalElements: null, totalPages: null, totalExact: false, hasNext, hasPrevious: page.page.number > 0, nextPage: hasNext ? page.page.number + 1 : null },
  };
}
export async function searchAll(keyword?: string, page = 0, size = 4): Promise<SearchResponse> {
  const [jobs, news, projects] = await Promise.all([searchJobs({ keyword, page, size }), searchNews({ keyword, page, size }), searchProjects({ keyword, page, size })]);
  return { jobs, news, projects };
}
