import FallbackImage from "../../../atoms/fallbackImage";
import LikeSVG from "../../../svg/likeSVG";
import ViewSVG from "../../../svg/viewSVG";
import noImg from "../../../../assets/noImg.png";

interface Props {
  id: number;
  title: string;
  content: string;
  thumbnailUrl?: string;
  viewCount: number;
  likeCount: number;
  likedByMe?: boolean; // 현재 사용자가 좋아요했는지 여부
  nickname: string;
  onCardClick: (id: number) => void;
  type: "project";
}

function MyProjectCard({
  id,
  title,
  content,
  thumbnailUrl,
  viewCount,
  likeCount,
  likedByMe = false,
  nickname,
  onCardClick,
}: Props) {
  const handleClick = () => {
    onCardClick(id);
  };

  return (
    <div
      className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden cursor-pointer"
      onClick={handleClick}
    >
      <section className="w-full h-48">
        <FallbackImage
          className="w-full object-cover h-full"
          src={thumbnailUrl || noImg}
          fallback={noImg}
          alt="카드 이미지"
        />
      </section>
      <section className="p-3 sm:p-4">
        <div className="text-lg sm:text-xl lg:text-2xl font-bold line-clamp-2 text-gray-800 mb-2">
          {title || "제목 없음"}
        </div>
        <div className="text-sm sm:text-base text-gray-600 line-clamp-2">
          {content || "내용 없음"}
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
        {/* 작성자 정보 (본인 프로젝트이므로 작게 표시) */}
        <div className="text-xs text-gray-400">{nickname}</div>
      </section>
    </div>
  );
}

export default MyProjectCard;
