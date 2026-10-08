import { Link } from "react-router";
import type { NewsCardProps } from "../../atoms/card";

function RecommendCard({
  thumbnailUrl,
  title,
  description,
  url,
  publishedAt, // LocalDate는 문자열로 옴
}: NewsCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      <Link to={url} target="_blank" rel="noopener noreferrer">
        {/* 모바일: 세로 배치, 태블릿 이상: 가로 배치 */}
        <div className="flex flex-col sm:flex-row p-3 sm:p-4">
          {/* 모바일에서는 이미지가 위에 */}
          <div className="w-full sm:hidden mb-3">
            <img
              src={thumbnailUrl}
              alt="카드 이미지"
              className="w-full h-32 object-cover rounded-lg"
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
            <div className="text-xs sm:text-sm text-gray-500">
              {publishedAt}
            </div>
          </div>

          {/* 태블릿 이상에서만 보이는 우측 이미지 - 직사각형으로 변경 */}
          {/* 태블릿 이상에서만 보이는 우측 이미지 */}
          <div className="hidden sm:block flex-shrink-0 w-24 sm:w-28 lg:w-32 aspect-[3/2]">
            <img
              src={thumbnailUrl}
              alt="카드 이미지"
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
        </div>
      </Link>
    </div>
  );
}

export default RecommendCard;
