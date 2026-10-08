import type { News, NewsPageData } from '../../types/newsTypes';
import { copy, showcaseState } from '../state';
function newsPage(items: News[], page: number, size: number): NewsPageData {
  const currentPage = Math.max(1, page);
  const limit = Math.max(1, size);
  return { content: copy(items.slice((currentPage - 1) * limit, currentPage * limit)), totalPages: Math.ceil(items.length / limit), totalElements: items.length, currentPage, isLast: currentPage * limit >= items.length };
}
export const LatestNewsData = async () => copy(showcaseState.news);
export const getLatestNewsPaginated = async (page = 1, size = 10) => newsPage(showcaseState.news, page, size);
export const getCompanyNews = async (companyId: number, page = 1, pageSize = 10) => newsPage(showcaseState.news.filter(item => item.company?.id === companyId), page, pageSize).content;
export const getCompanyNewsPaginated = async (companyId: number, page = 0, size = 10) => newsPage(showcaseState.news.filter(item => item.company?.id === companyId), page + 1, size);
export const TopCompaniesData = async () => showcaseState.companies.map((company, index) => ({ companyId: company.id, articleCount: showcaseState.news.filter(item => item.company?.id === company.id).length, companyName: company.name, likeCount: showcaseState.likes.companies.includes(company.id) ? 1 : 0, rank: index + 1 }));
