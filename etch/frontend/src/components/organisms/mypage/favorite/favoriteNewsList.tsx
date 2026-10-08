import { useState, useEffect } from "react";
import { Link } from "react-router";
import { likeApi } from "../../../../api/likeApi";
import type { NewsLike } from "../../../../types/like";

interface Props {
  titleText: string;
  subText: string;
}

function FavoriteNewsList({ titleText, subText }: Props) {
  const [news, setNews] = useState<NewsLike[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFavoriteNews = async () => {
      try {
        setIsLoading(true);
        const data = await likeApi.news.getLikes();
        setNews(data);
      } catch (error: any) {
        console.error("관심뉴스 목록 조회:", error);
        // 400 에러는 데이터가 없음을 의미하므로 빈 배열로 처리
        if (error.response?.status === 400) {
          setNews([]);
        } else {
          console.error("예상치 못한 에러:", error);
          setNews([]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavoriteNews();
  }, []);

  const handleRemoveNews = async (newsId: number, newsTitle: string) => {
    if (!confirm(`'${newsTitle}'을(를) 관심뉴스에서 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await likeApi.news.removeLike(newsId);
      setNews(news.filter(item => item.id !== newsId));
      alert("관심뉴스에서 삭제되었습니다.");
    } catch (error) {
      console.error("관심뉴스 삭제 실패:", error);
      alert("관심뉴스 삭제에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "short", 
        day: "numeric",
      });
    } catch {
      return dateString;
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
              <div key={i} className="h-20 bg-gray-100 rounded"></div>
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
            {titleText} ({news.length})
          </h1>
          <p className="text-sm text-gray-500">{subText}</p>
        </div>
      </div>
      
      {/* List Section - 스크롤 가능 */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {news.length > 0 ? (
          news.map((newsItem) => (
            <div key={newsItem.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-3">
                  {newsItem.thumbnailUrl && (
                    <img
                      src={newsItem.thumbnailUrl}
                      alt="뉴스 썸네일"
                      className="w-12 h-9 object-cover rounded flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <Link
                      to={newsItem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 hover:text-blue-600 transition-colors text-sm">
                        {newsItem.title}
                      </h3>
                    </Link>
                    {newsItem.description && (
                      <p className="text-xs text-gray-600 mb-2 line-clamp-1">
                        {newsItem.description}
                      </p>
                    )}
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>{formatDate(newsItem.publishedAt)}</span>
                      {newsItem.name && (
                        <span className="text-gray-400 truncate ml-2">{newsItem.name}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleRemoveNews(newsItem.id, newsItem.title)}
                className="ml-3 p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors flex-shrink-0"
                title="관심뉴스 삭제"
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
                  d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                />
              </svg>
            </div>
            <p className="text-gray-500 text-sm font-medium">
              관심 뉴스가 없습니다
            </p>
            <p className="text-gray-400 text-xs mt-1">
              관심있는 뉴스를 하트로 등록해보세요
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default FavoriteNewsList;