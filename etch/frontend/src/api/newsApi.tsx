/* eslint-disable react-refresh/only-export-components */

import axios from "axios";
import { BASE_API } from "./BASE_API";
import { getCompany } from "./companyApi";
import type { TopCompany } from "../types/topCompanies";
import type { News, NewsPageData } from "../types/newsTypes";

// API 응답을 위한 Wrapper 타입 정의
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string | null;
}

// 백엔드 CompanyNewsDTO 타입 (내부 사용)
interface CompanyNewsDTO {
  id: number;
  thumbnailUrl: string;
  title: string;
  description: string;
  url: string;
  publishedAt: string;
}

// 백엔드 PageResponseDTO 타입
interface PageResponseDTO<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
  isLast: boolean;
}
// 페이지네이션 응답 타입 추가
interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
  isLast: boolean;
}

// 🔥 기존 함수 (호환성 유지용) - 첫 페이지만 반환
export async function LatestNewsData(): Promise<News[]> {
  try {
    const res = await axios.get(`${BASE_API}/news/latest`);

    // 🔥 페이지네이션 응답에서 content 배열 추출
    const pageData = res.data.data;
    return pageData.content || [];
  } catch (error) {
    console.error("최신 뉴스 조회 실패:", error);
    throw error;
  }
}

// 🔥 새로 추가: 페이지네이션 지원 최신 뉴스 함수
// newsApi.tsx
export async function getLatestNewsPaginated(
  page: number = 1,
  size: number = 10
): Promise<NewsPageData> {
  try {
    // 🔥 page 값을 그대로 전송 (백엔드에서 -1 처리함)
    const res = await axios.get(
      `${BASE_API}/news/latest?page=${page}&size=${size}`
    );

    return res.data.data;
  } catch (error) {
    console.error("페이지네이션된 최신 뉴스 조회 실패:", error);
    throw error;
  }
}

// 특정 기업의 뉴스 목록 조회 (Company 정보와 함께 News 타입으로 반환)
export async function getCompanyNews(
  companyId: number,
  page: number = 1,
  pageSize: number = 10
): Promise<News[]> {
  try {
    // 1. 기업 뉴스 목록 조회
    const newsResponse = await axios.get<
      ApiResponse<PageResponseDTO<CompanyNewsDTO>>
    >(
      `${BASE_API}/news/companies/${companyId}?page=${page}&pageSize=${pageSize}`
    );

    // 2. 기업 정보 조회
    const company = await getCompany(companyId);

    // 3. CompanyNewsDTO를 News 타입으로 변환
    const newsList: News[] = newsResponse.data.data.content.map((newsItem) => ({
      id: newsItem.id,
      thumbnailUrl: newsItem.thumbnailUrl,
      title: newsItem.title,
      description: newsItem.description,
      url: newsItem.url,
      publishedAt: newsItem.publishedAt,
      company: company,
    }));

    return newsList;
  } catch (error) {
    console.error(`Company ${companyId} 뉴스 조회 실패:`, error);
    throw error;
  }
}

// 🔥 새로 추가: 페이지네이션 지원 회사 뉴스 함수
export async function getCompanyNewsPaginated(
  companyId: number,
  page: number = 0,
  size: number = 10
): Promise<NewsPageData> {
  try {
    const res = await axios.get(
      `${BASE_API}/news/companies/${companyId}?page=${page}&size=${size}`
    );

    // 전체 페이지네이션 정보 반환
    return res.data.data;
  } catch (error) {
    console.error("페이지네이션된 회사 뉴스 조회 실패:", error);
    throw error;
  }
}

export async function TopCompaniesData(): Promise<TopCompany[]> {
  try {
    const res = await axios.get<ApiResponse<PageResponse<TopCompany>>>(
      `${BASE_API}/news/top-companies`
    );

    // 🔥 페이지네이션이 적용되었다면 content 추출, 아니라면 그대로 반환
    const data = res.data.data;

    // data가 배열이면 그대로 반환, 페이지네이션 객체면 content 추출
    if (Array.isArray(data)) {
      return data;
    } else if (data && typeof data === "object" && "content" in data) {
      return data.content || [];
    }

    return [];
  } catch (error) {
    console.error("상위 회사 조회 실패:", error);
    throw error;
  }
}
