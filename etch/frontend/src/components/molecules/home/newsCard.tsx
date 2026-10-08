import { DEMO_MODE } from "../../../config/demo";
import { useState } from "react";
import { Link } from "react-router";
import type { NewsCardProps } from "../../atoms/card";
import HeartSVG from "../../svg/heartSVG";
import { likeApi } from "../../../api/likeApi";

interface NewsCardWithLikeProps extends NewsCardProps {
  isLiked?: boolean;
  onLikeStateChange?: (newsId: number, isLiked: boolean) => void;
}

function NewsCard({ 
  id, 
  title, 
  url, 
  publishedAt, 
  description, 
  companyName, 
  onLikeClick,
  isLiked = false,
  onLikeStateChange 
}: NewsCardWithLikeProps) {
  const [isLiking, setIsLiking] = useState(false);

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isLiking) return;

    try {
      setIsLiking(true);
      
      if (isLiked) {
        // 이미 좋아요한 경우 - 삭제
        await likeApi.news.removeLike(id);
        alert("관심 뉴스에서 삭제되었습니다!");
        onLikeStateChange?.(id, false);
      } else {
        // 좋아요하지 않은 경우 - 추가
        await likeApi.news.addLike(id);
        alert("관심 뉴스로 등록되었습니다!");
        onLikeStateChange?.(id, true);
      }
      
      onLikeClick?.(id);
    } catch (error: any) {
      console.error("관심 뉴스 처리 실패:", error);
      if (error.response?.data?.message === "이미 좋아요를 누른 콘텐츠입니다.") {
        alert("이미 관심 뉴스로 등록된 뉴스입니다.");
      } else {
        alert(`관심 뉴스 ${isLiked ? '삭제' : '등록'}에 실패했습니다. 다시 시도해주세요.`);
      }
    } finally {
      setIsLiking(false);
    }
  };
  // 날짜 포맷팅 함수 (선택사항)
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString; // 파싱 실패시 원본 반환
    }
  };

  if (DEMO_MODE) return <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
    <details><summary className="cursor-pointer text-base font-semibold text-gray-900 hover:text-blue-700">{title}</summary>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-gray-700"><p className="whitespace-pre-wrap">{description || "등록된 요약이 없습니다."}</p><p className="rounded bg-blue-50 p-3 text-xs text-blue-900">합성 뉴스 요약입니다. 실제 기사 원문과 외부 링크는 제공하지 않습니다.</p></div>
    </details><p className="mt-3 text-xs text-gray-500">{formatDate(publishedAt)} · {companyName} · 제목을 눌러 요약 보기</p>
  </article>;

  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      <div className="p-3 sm:p-4">
        <div className="flex justify-between items-start mb-2">
          <Link to={url} target="_blank" rel="noopener noreferrer" className="flex-1">
            <div className="text-base sm:text-lg font-bold line-clamp-2 text-gray-800 hover:text-blue-600 transition-colors">
              {title}
            </div>
          </Link>
          
          <button
            onClick={handleLikeClick}
            disabled={isLiking}
            className={`ml-2 p-2 rounded-full transition-colors ${
              isLiking 
                ? "text-gray-300 cursor-not-allowed" 
                : isLiked
                  ? "text-red-500 hover:text-red-600 hover:bg-red-50"
                  : "text-gray-400 hover:text-red-500 hover:bg-red-50"
            }`}
            title={isLiked ? "관심 뉴스 삭제" : "관심 뉴스 등록"}
          >
            {isLiking ? (
              <div className="w-5 h-5 animate-spin">
                <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="31.416" strokeDashoffset="31.416">
                    <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
                    <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
                  </circle>
                </svg>
              </div>
            ) : (
              <HeartSVG filled={isLiked} />
            )}
          </button>
        </div>

        <Link to={url} target="_blank" rel="noopener noreferrer">
          {/* description이 있으면 표시 */}
          {description && (
            <div className="text-sm text-gray-600 mb-2 line-clamp-2">
              {description}
            </div>
          )}

          <div className="flex justify-between items-center text-gray-500 text-sm">
            {/* 발행일 */}
            <div className="text-xs sm:text-sm whitespace-nowrap">
              {formatDate(publishedAt)}
            </div>
            
            {/* 회사명 */}
            {companyName && (
              <div className="text-xs sm:text-sm text-gray-400">
                {companyName}
              </div>
            )}
          </div>
        </Link>
      </div>
    </div>
  );
}

export default NewsCard;
