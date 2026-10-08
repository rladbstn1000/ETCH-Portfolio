import type { FavoriteCompanyProps } from "../../../../atoms/list";
import { useState } from "react";
import LikeSVG from "../../../../svg/likeSVG";
// 기존 LikeSVG를 사용하거나, 위의 enhanced_like_svg 아티팩트를 LikeSVG.tsx로 저장하여 import

function FavoriteCompanyCard({ companyName, img }: FavoriteCompanyProps) {
  const [isFavorited, setIsFavorited] = useState(true); // 기본값을 true로 설정 (즐겨찾기 목록이므로)

  const handleFavoriteToggle = () => {
    setIsFavorited(!isFavorited);
    // 여기에 API 호출이나 상태 업데이트 로직 추가
  };
  return (
    <div className="relative flex flex-col items-center p-4 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 w-full">
      {/* 좋아요 버튼 */}
      <button
        onClick={handleFavoriteToggle}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 transition-all duration-200 z-10 group"
        aria-label={`${companyName} ${
          isFavorited ? "즐겨찾기 해제" : "즐겨찾기 추가"
        }`}
      >
        <LikeSVG
          isLiked={isFavorited}
          size={24}
          className={`transition-transform duration-200 ${
            isFavorited ? "scale-100" : "scale-90 group-hover:scale-100"
          }`}
        />
      </button>

      <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mb-3 flex-shrink-0">
        <img
          src={img}
          alt={companyName}
          className="w-full h-full object-contain rounded-lg"
        />
      </div>
      <div className="text-sm sm:text-base md:text-lg font-medium text-gray-800 text-center line-clamp-2">
        {companyName}
      </div>
    </div>
  );
}

export default FavoriteCompanyCard;
