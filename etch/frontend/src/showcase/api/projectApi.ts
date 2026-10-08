import type { ProjectInputData } from '../../types/project/projectDatas';
export type { MyProjectResponse, ProjectCreateRequestData } from '../../api/projectApi';
import { copy, requireItem, showcaseState, changedShowcase } from '../state';
import { virtualMember } from '../data';
import { likeApi } from './likeApi';
import { paginate } from './searchApi';
export const getAllProjects = async () => copy(showcaseState.projects);
export const getAllProjectsUnsorted = getAllProjects;
export const getAllProjectsWithPaging = async (page = 0, size = 20, sort = 'latest') => paginate([...showcaseState.projects].sort((a, b) => sort.toLowerCase() === 'popular' ? b.likeCount - a.likeCount : b.id - a.id), page, size);
export const getProjectById = async (id: number) => copy(requireItem(showcaseState.projects, id));
export const getMyProjects = async () => copy(showcaseState.projects.filter(item => item.memberId === virtualMember.id));
export const getUserPublicProjects = async (userId: number) => copy(showcaseState.projects.filter(item => item.memberId === userId));
export const getUserProjects = async (userId: number, _isPublicOnly = false) => getUserPublicProjects(userId);
export const getLikedProjects = likeApi.projects.getLikes;
export const likeProject = likeApi.projects.addLike;
export const unlikeProject = likeApi.projects.removeLike;
export const createProject = async (_input: ProjectInputData): Promise<never> => { throw new Error('새 프로젝트 제출과 파일 업로드는 화면 체험 범위에 포함되지 않습니다.'); };
export const updateProject = async (id: number, input: ProjectInputData) => {
  const project = requireItem(showcaseState.projects, id);
  project.title = input.title; project.content = input.content; project.projectCategory = input.projectCategory;
  // 공개 자료만 포함한 메모리 예시. 파일/연락처/외부 링크는 받지 않는다.
  changedShowcase(); return copy(project);
};
export const deleteProject = async (id: number) => { showcaseState.projects = showcaseState.projects.filter(item => item.id !== id); showcaseState.likes.projects = showcaseState.likes.projects.filter(item => item !== id); changedShowcase(); };
