import { initialApplications, initialCompanies, initialCoverLetters, initialJobs, initialNews, initialPortfolios, initialProjects, publicAssets, referenceDate } from './data';
import type { Comment } from '../types/comment';

function initialState() {
  return structuredClone({
    jobs: initialJobs, news: initialNews, companies: initialCompanies, projects: initialProjects,
    coverLetters: initialCoverLetters, portfolios: initialPortfolios, applications: initialApplications,
    likes: { jobs: [1001], news: [2001], projects: [3003], companies: [8001] },
    following: [7002],
    comments: { 3001: [{ id: 4001, memberId: 7002, nickname: '가상 동료', content: '키보드로 이동하는 화면 구성이 흥미로운 예시네요.', createdAt: `${referenceDate}T10:00:00`, isDeleted: false, profile: publicAssets.profile }] } as Record<number, Comment[]>,
  });
}
export const showcaseState = initialState();
let version = 0;
const listeners = new Set<() => void>();
export const getShowcaseVersion = () => version;
export const subscribeShowcase = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export function changedShowcase() { version += 1; listeners.forEach(listener => listener()); }
export function resetShowcase() { Object.assign(showcaseState, initialState()); changedShowcase(); }
export const copy = <T,>(value: T): T => structuredClone(value);
export function requireItem<T extends { id: number }>(items: T[], id: number): T {
  const item = items.find(entry => entry.id === id);
  if (!item) throw new Error('해당 예시 항목을 찾을 수 없습니다.');
  return item;
}
