import type { AppliedJobUpdateRequest } from '../../types/appliedJob';
import { changedShowcase, copy, showcaseState } from '../state';
const codes = { SCHEDULED: '지원 예정 예시', DOCUMENT_DONE: '서류 제출 예시', INTERVIEW_DONE: '면접 완료 예시', FINAL_PASSED: '최종 합격 예시', DOCUMENT_FAILED: '서류 불합격 예시', INTERVIEW_FAILED: '면접 불합격 예시' };
export const getAppliedJobsList = async () => copy(showcaseState.applications);
export const getApplyStatusCodes = async (): Promise<Record<string, string>> => ({ ...codes });
export const applyJob = async (_id: number): Promise<never> => { throw new Error('정적 체험판에서는 지원서를 제출하지 않습니다.'); };
export const updateAppliedJobStatus = async (id: number, input: AppliedJobUpdateRequest) => {
  const item = showcaseState.applications.find(item => item.appliedJobId === id);
  if (!item || !(input.status in codes)) throw new Error('지원 현황 예시를 찾을 수 없습니다.');
  item.status = input.status; changedShowcase();
};
export const deleteAppliedJob = async (id: number) => { showcaseState.applications = showcaseState.applications.filter(item => item.appliedJobId !== id); changedShowcase(); };
