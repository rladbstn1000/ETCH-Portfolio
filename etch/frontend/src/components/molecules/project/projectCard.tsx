import LikeSVG from "../../svg/likeSVG";
import ViewSVG from "../../svg/viewSVG";
import noImg from "../../../assets/noImg.png";
import FallbackImage from "../../atoms/fallbackImage";

// 필요한 필드만 선택적으로 받는 인터페이스
interface Props {
  id: number;
  title: string;
  thumbnailUrl?: string;
  type: "project";
  viewCount: number;
  likeCount: number;
  likedByMe?: boolean; // 현재 사용자가 좋아요했는지 여부
  nickname: string;
  onCardClick: (id: number) => void;
}

function ProjectCard({
  id,
  title,
  thumbnailUrl,
  onCardClick,
  viewCount,
  nickname,
  likeCount,
  likedByMe = false, // 기본값은 false
}: Props) {
  const handleClick = () => {
    onCardClick(id);
  };

  return (
    <div
      className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden cursor-pointer"
      onClick={handleClick}
    >
      <section className="w-full h-56">
        <FallbackImage
          className="w-full object-cover h-full"
          src={thumbnailUrl || noImg}
          fallback={noImg}
          alt="카드 이미지"
        />
      </section>
      <section className="p-3 sm:p-4">
        <div className="text-lg sm:text-xl lg:text-2xl font-bold line-clamp-2 text-gray-800 mb-2">
          <button type="button" onClick={event => { event.stopPropagation(); handleClick(); }} className="text-left hover:text-blue-700">{title || "제목 없음"}</button>
        </div>
        <div className="text-sm sm:text-base text-gray-600 line-clamp-2">
          {nickname || "작성자 없음"}
        </div>
      </section>
      <section className="p-3 sm:p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* 좋아요 표시 (클릭 불가, 상태만 표시) */}
          <div
            className={`flex items-center gap-1 text-sm ${
              likedByMe ? "text-red-500" : "text-gray-500"
            }`}
          >
            <LikeSVG isLiked={likedByMe} />
            <span>{likeCount || 0}</span>
          </div>
          {/* 조회수 */}
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <ViewSVG />
            <span>{viewCount || 0}</span>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ProjectCard;
