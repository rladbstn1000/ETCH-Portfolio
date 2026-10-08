import type { CompanyLike, JobLike, NewsLike, ProjectLike } from '../../types/like';
import { changedShowcase, copy, showcaseState } from '../state';
import { publicAssets } from '../data';
type Kind = keyof typeof showcaseState.likes;
function operations<T>(kind: Kind, list: () => T[]) {
  return {
    getLikes: async () => copy(list()),
    addLike: async (id: number): Promise<void> => {
      if (!showcaseState[kind].some(item => item.id === id)) throw new Error('해당 예시 항목을 찾을 수 없습니다.');
      if (!showcaseState.likes[kind].includes(id)) {
        showcaseState.likes[kind].push(id);
        if (kind === 'projects') { const project = showcaseState.projects.find(item => item.id === id)!; project.likeCount += 1; project.likedByMe = true; }
        changedShowcase();
      }
    },
    removeLike: async (id: number): Promise<void> => {
      const index = showcaseState.likes[kind].indexOf(id);
      if (index >= 0) {
        showcaseState.likes[kind].splice(index, 1);
        if (kind === 'projects') { const project = showcaseState.projects.find(item => item.id === id); if (project) { project.likeCount = Math.max(0, project.likeCount - 1); project.likedByMe = false; } }
        changedShowcase();
      }
    },
  };
}
export const likeApi = {
  jobs: operations<JobLike>('jobs', () => showcaseState.jobs.filter(item => showcaseState.likes.jobs.includes(item.id)).map(({ id, title, companyName, regions, jobCategories, openingDate, expirationDate }) => ({ id, title, companyName, regions, jobCategories, openingDate, expirationDate }))),
  news: operations<NewsLike>('news', () => showcaseState.news.filter(item => showcaseState.likes.news.includes(item.id)).map(item => ({ id: item.id, title: item.title, description: item.description ?? '', thumbnailUrl: item.thumbnailUrl || publicAssets.placeholder, url: '', publishedAt: item.publishedAt, name: item.company?.name ?? '' }))),
  companies: operations<CompanyLike>('companies', () => showcaseState.companies.filter(item => showcaseState.likes.companies.includes(item.id)).map(({ id, name, industry }) => ({ id, name, industry }))),
  projects: operations<ProjectLike>('projects', () => showcaseState.projects.filter(item => showcaseState.likes.projects.includes(item.id)).map(({ id, title, thumbnailUrl, viewCount, nickname }) => ({ id, title, thumbnailUrl, viewCount, nickname, isDeleted: false }))),
};
