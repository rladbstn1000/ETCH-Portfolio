import { features, requireUploads } from "../config/features";
import { authInstance } from "./instances"; // authInstance를 import
import type { UserProfile } from "../types/userProfile";
import type { ProfileImageUpdateResponse } from "../types/member";
import type { Job } from "../types/job";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string | null;
}

export const getMemberById = async (memberId: number): Promise<UserProfile> => {
  // authInstance를 사용하여 API 호출
  const response = await authInstance.get<ApiResponse<UserProfile>>(`/members/${memberId}`);
  return response.data.data;
};

export const updateProfileImage = async (file: File): Promise<string> => {
  requireUploads(true);
  const formData = new FormData();
  formData.append('profile', file);
  
  const response = await authInstance.patch<ApiResponse<ProfileImageUpdateResponse>>(
    '/members/profile-update',
    formData
  );
  
  return response.data.data.profileImageUrl;
};

// RecommendJobDTO 인터페이스 (백엔드와 매칭)
interface RecommendJobDTO {
  id: number;
  title: string;
  companyName: string;
  region: string;
  industry: string;
  jobCategory: string;
  workType: string;
  educationLevel: string;
  openingDate: string; // LocalDateTime -> ISO string
  expirationDate: string; // LocalDateTime -> ISO string
}

// 추천 채용 정보 조회
export const getRecommendJobs = async (): Promise<Job[]> => {
  if (!features.recommendations) return [];
  const response = await authInstance.get<ApiResponse<RecommendJobDTO[]>>('/members/me/recommend-job');
  
  return response.data.data.map(job => ({
    id: job.id,
    title: job.title,
    companyName: job.companyName,
    companyId: 0, // 추천 API에는 companyId가 없음
    regions: job.region ? [job.region] : [],
    industries: job.industry ? [job.industry] : [],
    jobCategories: job.jobCategory ? [job.jobCategory] : [],
    workType: job.workType || '',
    educationLevel: job.educationLevel || '',
    openingDate: job.openingDate,
    expirationDate: job.expirationDate
  }));
};

// RecommendNewsDTO 인터페이스 (백엔드 응답과 매칭)
interface RecommendNewsDTO {
  id: number;
  thumbnailUrl?: string;
  title: string;
  description: string;
  url: string;
  publishedAt: string;
}

// 추천 뉴스 조회
export const getRecommendNews = async (): Promise<RecommendNewsDTO[]> => {
  if (!features.recommendations) return [];
  const response = await authInstance.get<ApiResponse<RecommendNewsDTO[]>>('/members/me/recommend-news');
  return response.data.data;
};

// 회원 탈퇴
export const deleteMember = async (): Promise<void> => {
  await authInstance.delete('/members');
};
