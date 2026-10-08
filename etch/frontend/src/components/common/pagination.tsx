interface PaginationProps {
  currentPage: number; // 현재 페이지 (1부터 시작)
  totalPages: number; // 전체 페이지 수
  totalElements: number; // 전체 데이터 개수
  isLast: boolean; // 마지막 페이지 여부
  onPageChange: (page: number) => void; // 페이지 변경 핸들러
  itemsPerPage?: number; // 페이지당 항목 수 (기본값: 10)
}

function Pagination({
  currentPage,
  totalPages,
  totalElements,
  isLast,
  onPageChange,
  itemsPerPage = 10,
}: PaginationProps) {
  // 페이지 번호 배열 생성 (현재 페이지 주변으로 5개)
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // 전체 페이지가 5개 이하면 모두 표시
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 현재 페이지를 중심으로 앞뒤 2개씩 표시
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, currentPage + 2);

      // 시작이나 끝에 가까우면 조정
      if (currentPage <= 3) {
        endPage = Math.min(5, totalPages);
      } else if (currentPage >= totalPages - 2) {
        startPage = Math.max(1, totalPages - 4);
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }

    return pages;
  };

  // 현재 페이지 범위 계산
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalElements);

  const pageNumbers = getPageNumbers();
  const isFirstPage = currentPage === 1;
  const showFirstPage = pageNumbers[0] > 1;
  const showLastPage = pageNumbers[pageNumbers.length - 1] < totalPages;

  return (
    <>
      {totalPages > 1 && (
        <section className="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            {/* 페이지 번호 */}
            <div className="flex items-center justify-center space-x-2">
              {/* 이전 페이지 버튼 */}
              <button
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                disabled={isFirstPage}
                onClick={() => {
                  if (!isFirstPage) {
                    onPageChange(currentPage - 1);
                  }
                }}
                aria-label="이전 페이지"
              >
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
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              {/* 첫 페이지 버튼 */}
              {showFirstPage && (
                <>
                  <button
                    className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => {
                      onPageChange(1);
                    }}
                  >
                    1
                  </button>
                  {pageNumbers[0] > 2 && (
                    <span className="px-2 text-gray-500">...</span>
                  )}
                </>
              )}

              {/* 페이지 번호들 */}
              {pageNumbers.map((page) => (
                <button
                  key={page}
                  className={`px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                    page === currentPage
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => {
                    onPageChange(page);
                  }}
                >
                  {page}
                </button>
              ))}

              {/* 마지막 페이지 버튼 */}
              {showLastPage && (
                <>
                  {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                    <span className="px-2 text-gray-500">...</span>
                  )}
                  <button
                    className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => {
                      onPageChange(totalPages);
                    }}
                  >
                    {totalPages}
                  </button>
                </>
              )}

              {/* 다음 페이지 버튼 */}
              <button
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                disabled={isLast}
                onClick={() => {
                  if (!isLast) {
                    onPageChange(currentPage + 1);
                  }
                }}
                aria-label="다음 페이지"
              >
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
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>

            {/* 페이지 정보 */}
            <div className="text-sm text-gray-600 text-center">
              <span className="font-medium">
                {startItem}-{endItem}
              </span>{" "}
              of <span className="font-medium">{totalElements}</span> 결과
            </div>
          </div>
        </section>
      )}
    </>
  );
}

export default Pagination;
