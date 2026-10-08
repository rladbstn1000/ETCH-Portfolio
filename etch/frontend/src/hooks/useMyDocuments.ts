import { useState, useEffect, useCallback } from "react";
import { getCoverLetters } from "../api/coverLetterApi";
import { getMyPortfolios } from "../api/portfolioApi"; // 새로 추가한 포트폴리오 API
import type { CoverLetterListResponse } from "../types/coverLetter";

// 포트폴리오 목록 타입 정의 (API 응답과 일치)
interface PortfolioListItem {
  id: number;
  introduce: string;
  updatedAt: string;
  name?: string;
}

interface MyDocumentsHookResult {
  coverLetters: CoverLetterListResponse[];
  portfolios: PortfolioListItem[]; // 타입 수정
  isLoading: boolean;
  error: string | null;
  refetchCoverLetters: () => void;
  refetchPortfolios: () => void; // 포트폴리오 리페치 함수 추가
}

export const useMyDocuments = (): MyDocumentsHookResult => {
  const [coverLetters, setCoverLetters] = useState<CoverLetterListResponse[]>(
    []
  );
  const [portfolios, setPortfolios] = useState<PortfolioListItem[]>([]); // 타입 수정
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch cover letters
  const fetchCoverLetters = useCallback(async () => {
    try {
      const fetchedCoverLetters = await getCoverLetters();
      setCoverLetters(fetchedCoverLetters);
    } catch (err) {
      console.error("Failed to fetch cover letters:", err);
      setError("자기소개서를 불러오는데 실패했습니다.");
      throw err; // 에러를 다시 던져서 호출하는 곳에서 처리할 수 있도록
    }
  }, []);

  // Function to fetch portfolios (새로 추가)
  const fetchPortfolios = useCallback(async () => {
    try {
      const fetchedPortfolios = await getMyPortfolios();
      setPortfolios(fetchedPortfolios);
    } catch (err) {
      console.error("Failed to fetch portfolios:", err);
      setError("포트폴리오를 불러오는데 실패했습니다.");
      throw err; // 에러를 다시 던져서 호출하는 곳에서 처리할 수 있도록
    }
  }, []);

  // 초기 데이터 로드
  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 자기소개서와 포트폴리오를 병렬로 로드
      await Promise.all([fetchCoverLetters(), fetchPortfolios()]);
    } catch (err) {
      // 에러는 각 fetch 함수에서 이미 처리됨
      console.error("Failed to load initial data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchCoverLetters, fetchPortfolios]);

  // 자기소개서만 리페치하는 함수
  const refetchCoverLetters = useCallback(async () => {
    try {
      await fetchCoverLetters();
    } catch {
      // 에러는 fetchCoverLetters에서 이미 처리됨
    }
  }, [fetchCoverLetters]);

  // 포트폴리오만 리페치하는 함수
  const refetchPortfolios = useCallback(async () => {
    try {
      await fetchPortfolios();
    } catch {
      // 에러는 fetchPortfolios에서 이미 처리됨
    }
  }, [fetchPortfolios]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  return {
    coverLetters,
    portfolios,
    isLoading,
    error,
    refetchCoverLetters,
    refetchPortfolios, // 새로 추가
  };
};
