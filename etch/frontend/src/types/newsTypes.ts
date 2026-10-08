// types/newsTypes.ts
import type { Company } from "./companyData";

// 회사 정보 타입 (CompanyEntity에 해당)

// 뉴스 타입 (NewsEntity/NewsDTO에 해당)
export interface News {
  id: number;
  thumbnailUrl?: string; // nullable이므로 optional
  title: string;
  description?: string; // TEXT 타입이므로 optional
  url: string;
  publishedAt: string; // LocalDate -> ISO 8601 문자열 형태
  company?: Company; // 회사 정보 (optional)
}

// 페이지네이션된 뉴스 데이터 타입
export interface NewsPageData {
  content: News[]; // ✅ any 대신 News[]
  totalPages: number;
  totalElements: number;
  currentPage: number;
  isLast: boolean;
}

// 재사용 가능한 제네릭 페이지네이션 타입
export interface PageData<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
  isLast: boolean;
}

// 타입 별칭으로도 사용 가능
export type NewsPageResponse = PageData<News>;
