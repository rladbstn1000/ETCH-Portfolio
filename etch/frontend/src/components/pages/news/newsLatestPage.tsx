import { useEffect, useState } from "react";
import Pagination from "../../common/pagination";
import AllLatestNews from "../../organisms/news/allLatestNews";
import { getLatestNewsPaginated } from "../../../api/newsApi";
import type { NewsPageData } from "../../../types/newsTypes";

function NewsLatestPage() {
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


      // 페이지네이션된 뉴스 데이터 요청
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

    // 페이지 변경 시 스크롤을 상단으로 이동
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 초기 데이터 로드
  useEffect(() => {
    loadNewsData(1);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 sm:space-y-12">
        {/* 헤더 섹션 */}
        <section className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">최신 뉴스</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            IT 업계의 최신 소식과 트렌드를 확인하세요. 주요 기업들의 동향과 기술
            발전 현황을 한눈에 볼 수 있습니다.
          </p>
        </section>

        {/* 최신 뉴스 섹션 */}
        <section className="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
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
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                최신 뉴스
              </h2>
            </div>

            {/* 뉴스 개수 표시 */}
            <div className="text-sm text-gray-600">
              총{" "}
              <span className="font-medium text-gray-900">
                {newsPageData.totalElements}
              </span>
              개의 뉴스
            </div>
          </div>

          {/* 로딩 상태 */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                <p className="text-gray-500">뉴스를 불러오는 중...</p>
              </div>
            </div>
          )}

          {/* 에러 상태 */}
          {error && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <div className="text-red-500 text-4xl">⚠️</div>
                <p className="text-red-600 font-medium">{error}</p>
                <button
                  onClick={() => loadNewsData(newsPageData.currentPage)}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm"
                >
                  다시 시도
                </button>
              </div>
            </div>
          )}

          {/* 뉴스 리스트 */}
          {!loading && !error && (
            <>
              {newsPageData.content.length > 0 ? (
                <AllLatestNews newsData={newsPageData.content} />
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">📰</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    뉴스가 없습니다
                  </h3>
                  <p className="text-gray-600">
                    아직 등록된 뉴스가 없습니다. 잠시 후 다시 확인해보세요.
                  </p>
                </div>
              )}
            </>
          )}
        </section>

        {/* 페이지네이션 */}
        {!loading && !error && newsPageData.totalPages > 1 && (
          <Pagination
            currentPage={newsPageData.currentPage}
            totalPages={newsPageData.totalPages}
            totalElements={newsPageData.totalElements}
            isLast={newsPageData.isLast}
            onPageChange={handlePageChange}
            itemsPerPage={10}
          />
        )}
      </div>
    </div>
  );
}

export default NewsLatestPage;
