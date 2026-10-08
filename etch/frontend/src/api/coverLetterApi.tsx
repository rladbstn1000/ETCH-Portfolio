import { authInstance } from "./instances";
import type {
  CoverLetterRequest,
  CoverLetterDetailResponse,
  CoverLetterListResponse,
} from "../types/coverLetter";

// API 응답을 위한 Wrapper 타입 정의 (authApi.tsx와 동일하게)
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string | null;
}

const BASE_URL = "/coverletters";

export const getCoverLetters = async (): Promise<CoverLetterListResponse[]> => {
  const response = await authInstance.get<
    ApiResponse<CoverLetterListResponse[]>
  >(`${BASE_URL}/list`);
  return response.data.data;
};

export const getCoverLetterDetail = async (
  id: number
): Promise<CoverLetterDetailResponse> => {
  const response = await authInstance.get<
    ApiResponse<CoverLetterDetailResponse>
  >(`${BASE_URL}/${id}`);
  return response.data.data;
};

export const createCoverLetter = async (
  data: CoverLetterRequest
): Promise<void> => {
  // create는 응답 데이터가 없으므로 ApiResponse<any> 또는 ApiResponse<void>로 처리
  await authInstance.post<ApiResponse<any>>(BASE_URL, data);
};

export const updateCoverLetter = async (
  id: number,
  data: CoverLetterRequest
): Promise<CoverLetterDetailResponse> => {
  const response = await authInstance.put<
    ApiResponse<CoverLetterDetailResponse>
  >(`${BASE_URL}/${id}`, data);
  return response.data.data;
};

export const deleteCoverLetter = async (id: number): Promise<void> => {
  // delete도 응답 데이터가 없으므로 ApiResponse<any> 또는 ApiResponse<void>로 처리
  await authInstance.delete<ApiResponse<any>>(`${BASE_URL}/${id}`);
};
