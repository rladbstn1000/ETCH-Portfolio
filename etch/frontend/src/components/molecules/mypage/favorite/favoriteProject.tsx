// molecules/mypage/favorite/favoriteProject.tsx
import type { FavoriteProjectProps } from "../../../atoms/list";
import noImg from "../../../../assets/noImg.png";

function FavoriteProject({
  id,
  title, // projectName → title
  nickname, // writer → nickname
  thumbnailUrl, // img → thumbnailUrl
  viewCount,
  likeCount,
  onCardClick,
}: FavoriteProjectProps) {
  const handleClick = () => {
    onCardClick?.(id);
  };

  return (
    <div
      className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
      onClick={handleClick}
    >
      <img
        src={thumbnailUrl || noImg}
        alt={title}
        className="w-16 h-16 object-cover rounded-lg"
        onError={(e) => {
          e.currentTarget.src = noImg;
        }}
      />
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 truncate">{title}</h3>
        <p className="text-sm text-gray-500">{nickname}</p>
        <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
          <span>👁️ {viewCount}</span>
          <span>💝 {likeCount}</span>
        </div>
      </div>
    </div>
  );
}

export default FavoriteProject;
