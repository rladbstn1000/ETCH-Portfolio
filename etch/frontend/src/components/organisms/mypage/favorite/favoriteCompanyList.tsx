import { notifyUser, confirmUser } from "../../../../config/experienceText";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { likeApi } from "../../../../api/likeApi";
import type { CompanyLike } from "../../../../types/like";

interface Props {
  titleText: string;
  subText: string;
}

function FavoriteCompanyList({ titleText, subText }: Props) {
  const [companies, setCompanies] = useState<CompanyLike[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFavoriteCompanies = async () => {
      try {
        setIsLoading(true);
        const data = await likeApi.companies.getLikes();
        setCompanies(data);
      } catch (error: any) {
        console.error("관심기업 목록 조회:", error);
        // 400 에러는 데이터가 없음을 의미하므로 빈 배열로 처리
        if (error.response?.status === 400) {
          setCompanies([]);
        } else {
          console.error("예상치 못한 에러:", error);
          setCompanies([]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavoriteCompanies();
  }, []);

  // 관심기업 클릭 시 검색페이지로 이동
  const handleCompanyClick = (companyName: string) => {
    navigate(`/search?q=${encodeURIComponent(companyName)}`);
  };

  const handleRemoveCompany = async (companyId: number, companyName: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 클릭 이벤트 전파 방지
    
    if (!confirmUser(`'${companyName}'을(를) 관심기업에서 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await likeApi.companies.removeLike(companyId);
      setCompanies(companies.filter(company => company.id !== companyId));
      notifyUser("관심기업에서 삭제되었습니다.");
    } catch (error) {
      console.error("관심기업 삭제 실패:", error);
      notifyUser("관심기업 삭제에 실패했습니다. 다시 시도해주세요.");
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-fit">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-[500px] flex flex-col">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">
            {titleText} ({companies.length})
          </h1>
          <p className="text-sm text-gray-500">{subText}</p>
        </div>
      </div>

      {/* List Section - 스크롤 가능 */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {companies.length > 0 ? (
          companies.map((company) => (
            <div 
              key={company.id} 
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              onClick={() => handleCompanyClick(company.name)}
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{company.name}</h3>
                <p className="text-sm text-gray-600 truncate">{company.industry}</p>
              </div>
              <button
                onClick={(e) => handleRemoveCompany(company.id, company.name, e)}
                className="ml-3 p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors flex-shrink-0"
                title="관심기업 삭제"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <p className="text-gray-500 text-sm font-medium">
              관심 기업이 없습니다
            </p>
            <p className="text-gray-400 text-xs mt-1">
              관심있는 기업을 등록해보세요
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default FavoriteCompanyList;
