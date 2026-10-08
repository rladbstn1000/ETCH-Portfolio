import { experienceText } from "../../../config/experienceText";
import { useState, useEffect } from "react";
import CompanyNews from "../../organisms/news/newsListCompany";
import LatestNews from "../../organisms/news/newsListLatest";
import { getLatestNewsPaginated, TopCompaniesData } from "../../../api/newsApi";
import type { TopCompany } from "../../../types/topCompanies";
import type { NewsPageData } from "../../../types/newsTypes";
import Pagination from "../../common/pagination";
import BuildingSVG from "../../svg/buildingSVG";

// 페이지네이션 데이터 타입은 이제 별도 파일에서 import

function NewsPage() {
  const [topCompaniesData, setTopCompaniesData] = useState<TopCompany[]>([]);
  const [newsPageData, setNewsPageData] = useState<NewsPageData>({
    content: [],
    totalPages: 0,
    totalElements: 0,
    currentPage: 1,
    isLast: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 뉴스 데이터 로드 함수
  const loadNewsData = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      // 페이지네이션된 뉴스 데이터 요청 (page는 0부터 시작)
      const data = await getLatestNewsPaginated(page, 10);

      setNewsPageData({
        content: data.content,
        totalPages: data.totalPages,
        totalElements: data.totalElements,
        currentPage: data.currentPage,
        isLast: data.isLast,
      });
    } catch (error) {
      console.error("뉴스 데이터 로딩 실패:", error);
      setError("뉴스 데이터를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    loadNewsData(page);
  };

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // 상위 기업 데이터와 첫 페이지 뉴스 데이터 병렬 로드
        const [companiesData] = await Promise.all([
          TopCompaniesData(),
          loadNewsData(1), // 첫 페이지 로드
        ]);

        setTopCompaniesData(companiesData);
      } catch (error) {
        console.error("초기 데이터 로딩 실패:", error);
        setError("데이터를 불러오는데 실패했습니다.");
      }
    };

    loadInitialData();
  }, []);

  return (
    <div className="min-h-screen">
      {/* 헤더 섹션 */}
      <div className="px-6 py-6 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          {/* 왼쪽: 제목과 설명 */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
              <svg
                className="w-5 h-5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">뉴스</h1>
              <p className="text-sm text-gray-600">최신 IT 뉴스와 기업 정보</p>
            </div>
          </div>
        </div>

        {/* 하단 정보 */}
        <div className="pt-4 mt-4 border-t border-gray-100">
          <div className="flex items-center space-x-6 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span>{experienceText.newsUpdates}</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              <span>관심 뉴스 등록 가능</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-8 sm:mt-12 sm:space-y-12">
        {/* 주요 기업 섹션 */}
        <section className="px-6 py-6 bg-white rounded-lg shadow-sm sm:py-8">
          <div className="flex items-center mb-6 space-x-3">
            <div className="flex items-center justify-center w-6 h-6 bg-purple-100 rounded-full">
              <BuildingSVG className="w-4 h-4 text-purple-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
              인기 기업
            </h2>
          </div>
          <CompanyNews companyData={topCompaniesData} />
        </section>

        {/* 최신 뉴스 섹션 */}
        <section className="px-6 py-6 bg-white rounded-lg shadow-sm sm:py-8">
          <div className="flex flex-col mb-6 space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-6 h-6 bg-green-100 rounded-full">
                <svg
                  className="w-4 h-4 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
                최신 뉴스
              </h2>
            </div>
          </div>

          {/* 로딩/에러 상태 처리 */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">뉴스를 불러오는 중...</div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-8">
              <div className="text-red-500">{error}</div>
            </div>
          )}

          {!loading && !error && <LatestNews newsData={newsPageData.content} />}
        </section>

        {/* 페이지네이션 */}
        {!loading && !error && newsPageData.totalPages > 0 && (
          <div className="px-6">
            <Pagination
              currentPage={newsPageData.currentPage}
              totalPages={newsPageData.totalPages}
              totalElements={newsPageData.totalElements}
              isLast={newsPageData.isLast}
              onPageChange={handlePageChange}
              itemsPerPage={10}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default NewsPage;
