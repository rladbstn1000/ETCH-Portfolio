import { defaultInstance } from "./instances";
import type { Company } from "../types/companyData";

// API 응답을 위한 Wrapper 타입 정의
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string | null;
}

// 특정 기업 정보 조회
export const getCompany = async (companyId: number): Promise<Company> => {
  try {
    const response = await defaultInstance.get<ApiResponse<Company>>(
      `/companies/${companyId}`
    );
    return response.data.data;
  } catch (error) {
    console.error(`Company ${companyId} 조회 실패:`, error);
    throw error;
  }
};
