import { authInstance } from "./instances"; // authInstance를 import
import type { UserProfile } from "../types/userProfile"; // UserProfile 타입 import

// API 응답을 위한 Wrapper 타입 정의 (다른 API 파일과 동일하게)
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string | null;
}

// 기존 API_SERVER_HOST와 apiClient 정의 및 인터셉터는 제거합니다.
// authInstance가 이 역할을 대신합니다.

export const getMemberInfo = async (): Promise<UserProfile> => {
  try {
    // authInstance를 사용하여 API 호출
    const response = await authInstance.get<ApiResponse<UserProfile>>("/members/me");
    return response.data.data; // 응답의 data 속성만 반환
  } catch (error) {
    throw error;
  }
};
