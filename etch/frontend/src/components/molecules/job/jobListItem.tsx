import { notifyUser } from "../../../config/experienceText";
import { DEMO_MODE } from "../../../config/demo";
import { useState } from "react";
import type { JobItemProps } from "../../atoms/listItem";
import BookmarkSVG from "../../svg/bookmarkSVG";
import { likeApi } from "../../../api/likeApi";

interface JobListItemWithBookmarkProps extends JobItemProps {
  onBookmarkClick?: (jobId: string | number) => void;
  isLiked?: boolean;
  onLikeStateChange?: (jobId: number, isLiked: boolean) => void;
}

export default function JobListItem({
  id,
  title,
  companyName,
  regions,
  industries,
  jobCategories,
  workType,
  educationLevel,
  openingDate,
  expirationDate,
  onClick,
  onBookmarkClick,
  isLiked = false,
  onLikeStateChange,
}: JobListItemWithBookmarkProps) {
  const [isBookmarking, setIsBookmarking] = useState(false);

  // 북마크 클릭 핸들러
  const handleBookmarkClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // 카드 클릭 이벤트와 분리
    
    if (isBookmarking) return;

    try {
      setIsBookmarking(true);
      
      if (isLiked) {
        // 이미 좋아요한 경우 - 삭제
        await likeApi.jobs.removeLike(Number(id));
        notifyUser("관심 공고에서 삭제되었습니다!");
        onLikeStateChange?.(Number(id), false);
      } else {
        // 좋아요하지 않은 경우 - 추가
        await likeApi.jobs.addLike(Number(id));
        notifyUser("관심 공고로 등록되었습니다!");
        onLikeStateChange?.(Number(id), true);
      }
      
      onBookmarkClick?.(id);
    } catch (error: any) {
      console.error("관심 공고 처리 실패:", error);
      if (error.response?.data?.message === "이미 좋아요를 누른 콘텐츠입니다.") {
        notifyUser("이미 관심 공고로 등록된 채용공고입니다.");
      } else {
        notifyUser(`관심 공고 ${isLiked ? '삭제' : '등록'}에 실패했습니다. 다시 시도해주세요.`);
      }
    } finally {
      setIsBookmarking(false);
    }
  };

  // 태그들을 조합 (배열이 아닐 수 있으므로 안전하게 처리)
  const safeRegions = Array.isArray(regions) ? regions : [];
  const safeJobCategories = Array.isArray(jobCategories) ? jobCategories : [];
  const safeIndustries = Array.isArray(industries) ? industries : [];
  const allTags = [
    ...safeJobCategories,
    ...safeIndustries,
    workType,
    educationLevel,
  ].filter(Boolean);

  return (
    <div
      onClick={() => onClick?.(id)}
      className="p-4 transition-shadow bg-white border border-gray-200 rounded-lg cursor-pointer hover:shadow-md h-48 flex flex-col"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="mb-1 text-lg font-semibold text-gray-900 truncate">
            <button type="button" onClick={event => { event.stopPropagation(); onClick?.(id); }} className="text-left hover:text-blue-700">{title || companyName}</button>
          </h3>
          <span className="text-sm text-gray-600 truncate block">
            {companyName}
          </span>
          <span className="text-xs text-gray-500 truncate block">
            {safeRegions.join(", ") || "위치 정보 없음"}
          </span>
        </div>
        {!DEMO_MODE && <button
          onClick={handleBookmarkClick}
          disabled={isBookmarking}
          className={`flex-shrink-0 p-1 rounded transition-colors ${
            isBookmarking 
              ? "text-gray-300 cursor-not-allowed" 
              : isLiked
                ? "text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50"
                : "text-gray-400 hover:text-yellow-500 hover:bg-yellow-50"
          }`}
          title={isLiked ? "관심 공고 삭제" : "관심 공고 등록"}
        >
          {isBookmarking ? (
            <div className="w-5 h-5 animate-spin">
              <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="31.416" strokeDashoffset="31.416">
                  <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
                  <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
                </circle>
              </svg>
            </div>
          ) : (
            <BookmarkSVG filled={isLiked} />
          )}
        </button>}
      </div>
      <div className="mb-3">
        <div className="text-sm text-gray-500">
          시작일: {new Date(openingDate).toLocaleDateString()}
        </div>
        <div className="text-sm text-gray-500">
          마감일: {new Date(expirationDate).toLocaleDateString()}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mt-auto overflow-hidden" style={{ maxHeight: '60px' }}>
        {allTags.slice(0, 4).map((tag, index) => (
          <span
            key={`${tag}-${index}`}
            className="px-2 py-1 text-xs text-gray-700 bg-gray-100 rounded-md whitespace-nowrap"
          >
            {tag}
          </span>
        ))}
        {allTags.length > 4 && (
          <span className="px-2 py-1 text-xs text-gray-600 bg-gray-300 rounded-md">
            +{allTags.length - 4}
          </span>
        )}
      </div>
    </div>
  );
}
