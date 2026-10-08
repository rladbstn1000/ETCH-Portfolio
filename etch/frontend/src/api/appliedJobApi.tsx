import { authInstance } from "./instances";
import type { 
  AppliedJobUpdateRequest,
  AppliedJobListResponse
} from "../types/appliedJob";

// API 응답을 위한 Wrapper 타입 정의
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string | null;
}

/**
 * POST /appliedJobs/{jobId} - 지원하기
 */
export const applyJob = async (jobId: number): Promise<void> => {
  try {
    await authInstance.post<ApiResponse<null>>(
      `/appliedJobs/${jobId}`
    );
  } catch (error) {
    console.error(`Job ${jobId} 지원 실패:`, error);
    throw error;
  }
};

/**
 * GET /appliedJobs/list - 지원 목록 조회
 */
export const getAppliedJobsList = async (): Promise<AppliedJobListResponse[]> => {
  try {
    const response = await authInstance.get<ApiResponse<AppliedJobListResponse[]>>(
      '/appliedJobs/list'
    );
    return response.data.data;
  } catch (error) {
    console.error('지원 목록 조회 실패:', error);
    throw error;
  }
};

/**
 * PUT /appliedJobs/{appliedJobId} - 지원 상태 업데이트
 */
export const updateAppliedJobStatus = async (
  appliedJobId: number, 
  updateData: AppliedJobUpdateRequest
): Promise<void> => {
  try {
    await authInstance.put<ApiResponse<null>>(
      `/appliedJobs/${appliedJobId}`,
      updateData
    );
  } catch (error) {
    console.error(`AppliedJob ${appliedJobId} 상태 업데이트 실패:`, error);
    throw error;
  }
};

/**
 * DELETE /appliedJobs/{appliedJobId} - 지원 취소/삭제
 */
export const deleteAppliedJob = async (appliedJobId: number): Promise<void> => {
  try {
    await authInstance.delete<ApiResponse<null>>(
      `/appliedJobs/${appliedJobId}`
    );
  } catch (error) {
    console.error(`AppliedJob ${appliedJobId} 삭제 실패:`, error);
    throw error;
  }
};

/**
 * GET /appliedJobs/codeList - 지원 상태 코드 목록 조회
 */
export const getApplyStatusCodes = async (): Promise<Record<string, string>> => {
  try {
    const response = await authInstance.get<ApiResponse<Record<string, string>>>(
      '/appliedJobs/codeList'
    );
    return response.data.data;
  } catch (error) {
    console.error('지원 상태 코드 목록 조회 실패:', error);
    throw error;
  }
};