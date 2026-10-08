import { copy, showcaseState } from '../state';
import { publicAssets, virtualMember } from '../data';
export const getMemberById = async (id: number) => id === virtualMember.id ? copy(virtualMember) : { id, nickname: '가상 동료', email: '', profile: publicAssets.profile };
export const getRecommendJobs = async () => copy(showcaseState.jobs.slice(0, 3));
export const getRecommendNews = async () => copy(showcaseState.news.slice(0, 3).map(item => ({ ...item, description: item.description ?? '' })));
export const updateProfileImage = async (_file: File): Promise<never> => { throw new Error('화면 체험판에서는 파일을 업로드하지 않습니다.'); };
export const deleteMember = async (): Promise<never> => { throw new Error('화면 체험판에는 삭제할 실제 계정이 없습니다.'); };
