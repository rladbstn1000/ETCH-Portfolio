import { defaultInstance } from "./instances";
import type { Job, JobListParams } from "../types/job";

// API 응답을 위한 Wrapper 타입 정의 (다른 API 파일과 동일하게)
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string | null;
}

// 특정 채용공고 조회
export const getJob = async (jobId: number): Promise<Job> => {
  try {
    const response = await defaultInstance.get<ApiResponse<Job>>(
      `/jobs/${jobId}`
    );
    return response.data.data;
  } catch (error) {
    console.error(`Job ${jobId} 조회 실패:`, error);
    throw error;
  }
};

// 날짜 범위로 채용공고 목록 조회
export const getJobsList = async (params: JobListParams): Promise<Job[]> => {
  try {
    const response = await defaultInstance.get<ApiResponse<Job[]>>(
      "/jobs/overlap",
      {
        params: {
          start: params.start,
          end: params.end,
        },
      }
    );
    return response.data.data;
  } catch (error) {
    console.error("채용공고 목록 조회 실패:", error);
    throw error;
  }
};

// 마감 임박 채용공고 목록 조회
export const getExpiringJobs = async (params: JobListParams): Promise<Job[]> => {
  try {
    const response = await defaultInstance.get<ApiResponse<Job[]>>(
      "/jobs/expiring",
      {
        params: {
          start: params.start,
          end: params.end,
        },
      }
    );
    return response.data.data;
  } catch (error) {
    console.error("마감 임박 채용공고 조회 실패:", error);
    throw error;
  }
};
