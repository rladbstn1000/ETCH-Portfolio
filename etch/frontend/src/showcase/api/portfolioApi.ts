import type { portfolioDatas } from '../../types/portfolio/portfolioDatas';
import type { PortfolioDetailResponseDTO, PortfolioProjectId } from '../../api/portfolioApi';
export type { PortfolioDetailResponseDTO, PortfolioProjectId, BackendArrayData, EduAndActDTO, CertAndLangDTO } from '../../api/portfolioApi';
import { changedShowcase, copy, showcaseState } from '../state';
import { referenceDate, virtualMember } from '../data';

interface CreatePortfolioRequest {
  name: string; introduce: string; phoneNumber: string; githubUrl?: string; blogUrl?: string;
  email?: string; techList?: string[]; education?: string; language?: string; projectIds?: number[];
}
function findPortfolio(id: number) {
  const item = showcaseState.portfolios.find(item => item.portfolioId === id);
  if (!item) throw new Error('포트폴리오 예시를 찾을 수 없습니다.');
  return item;
}
export const getMyPortfolios = async () => showcaseState.portfolios.map(item => ({ id: item.portfolioId, name: item.name, introduce: item.introduce, updatedAt: item.updatedAt }));
export async function getPortfolioDetail(id: number): Promise<PortfolioDetailResponseDTO> {
  const item = findPortfolio(id);
  return copy({
    ...item, language: [], education: [],
    projectList: showcaseState.projects.filter(project => item.projectIds.includes(project.id)).map(project => ({
      id: project.id, title: project.title, thumbnailUrl: project.thumbnailUrl, projectCategory: project.projectCategory,
      viewCount: project.viewCount, likeCount: project.likeCount, nickname: project.nickname, isPublic: true, popularityScore: project.popularityScore ?? 0,
    })),
  });
}
export async function getPortfolioByUserId(userId: number) {
  const item = showcaseState.portfolios.find(item => item.memberId === userId);
  if (!item) throw new Error('포트폴리오 예시를 찾을 수 없습니다.');
  return copy({ ...item, language: '', education: '', projectList: item.projectIds });
}
// 개인 연락처/외부 링크/파일은 체험판의 편집 필드가 아니다.
const publicFields = (input: CreatePortfolioRequest) => ({ name: input.name, introduce: input.introduce, techList: [...input.techList ?? []], projectIds: (input.projectIds ?? []).filter(id => showcaseState.projects.some(item => item.id === id)) });
export async function createPortfolio(input: CreatePortfolioRequest) {
  const item = { portfolioId: Math.max(6000, ...showcaseState.portfolios.map(item => item.portfolioId)) + 1, ...publicFields(input), phoneNumber: '', email: '', githubUrl: '', blogUrl: '', memberId: virtualMember.id, createdAt: referenceDate, updatedAt: referenceDate };
  showcaseState.portfolios.push(item); changedShowcase();
  return copy({ ...item, language: '', education: '', projectList: item.projectIds });
}
export const updatePortfolio = async (id: number, input: CreatePortfolioRequest) => { Object.assign(findPortfolio(id), publicFields(input)); changedShowcase(); };
export const deletePortfolio = async (id: number) => { showcaseState.portfolios = showcaseState.portfolios.filter(item => item.portfolioId !== id); changedShowcase(); };
export const createProject = async (_input: unknown): Promise<never> => { throw new Error('프로젝트 제출과 파일 업로드는 화면 체험 범위에 포함되지 않습니다.'); };
export const convertPortfolioDataToRequest = (input: portfolioDatas, projects: PortfolioProjectId[] = []): CreatePortfolioRequest => ({ name: input.name, introduce: input.introduce, phoneNumber: '', email: '', githubUrl: '', blogUrl: '', techList: input.stack.map(String), education: '', language: '', projectIds: projects.map(item => item.id) });
