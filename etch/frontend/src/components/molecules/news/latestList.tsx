import { useState } from "react";
import { Link } from "react-router";
import type { NewsCardProps } from "../../atoms/card";
import HeartSVG from "../../svg/heartSVG";
import { likeApi } from "../../../api/likeApi";
import noImg from "../../../assets/noImg.png";

interface LatestCardWithLikeProps extends NewsCardProps {
  isLiked?: boolean;
  onLikeStateChange?: (newsId: number, isLiked: boolean) => void;
}

function LatestCard({
  id,
  thumbnailUrl,
  title,
  description,
  url,
  publishedAt,
  companyName,
  onLikeClick,
  isLiked = false,
  onLikeStateChange,
}: LatestCardWithLikeProps) {
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

  // 이미지 에러 처리 함수
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = noImg;
  };

  // 유효한 이미지 URL 검사
  const getImageSrc = () => {
    if (!thumbnailUrl || thumbnailUrl.trim() === '') {
      return noImg;
    }
    return thumbnailUrl;
  };

  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      <div className="relative">
        <Link to={url} target="_blank" rel="noopener noreferrer">
          {/* 모바일: 세로 배치, 태블릿 이상: 가로 배치 */}
          <div className="flex flex-col sm:flex-row p-3 sm:p-4">
            {/* 모바일에서는 이미지가 위에 */}
            <div className="w-full sm:hidden mb-3">
              <img
                src={getImageSrc()}
                alt="카드 이미지"
                className="w-full h-32 object-cover rounded-lg"
                onError={handleImageError}
              />
            </div>

            {/* 텍스트 영역 */}
            <div className="flex-1 sm:pr-4">
              <div className="text-base sm:text-lg font-bold mb-2 line-clamp-2 text-gray-800">
                {title}
              </div>
              <div className="text-sm sm:text-base text-gray-600 line-clamp-2 mb-2">
                {description}
              </div>
              <div className="flex justify-between items-center">
                <div className="text-xs sm:text-sm text-gray-500">
                  {publishedAt}
                </div>
                {companyName && (
                  <div className="text-xs sm:text-sm text-gray-400">
                    {companyName}
                  </div>
                )}
              </div>
            </div>

            {/* 태블릿 이상에서만 보이는 우측 이미지 */}
            <div className="hidden sm:block flex-shrink-0 w-24 sm:w-28 lg:w-32 aspect-[3/2]">
              <img
                src={getImageSrc()}
                alt="카드 이미지"
                className="w-full h-full object-cover rounded-lg"
                onError={handleImageError}
              />
            </div>
          </div>
        </Link>
        
        {/* 하트 버튼 - 우상단에 고정 */}
        <button
          onClick={handleLikeClick}
          disabled={isLiking}
          className={`absolute top-3 right-3 p-2 rounded-full transition-colors bg-white/80 backdrop-blur-sm ${
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
    </div>
  );
}

export default LatestCard;
