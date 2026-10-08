import { features } from "../../../config/features";
import type { UserItemProps } from "../../atoms/listItem";
import ChatIcon from "../../svg/chatIcon";
import defaultProfile from "../../../assets/default-profile.png";

function UserItem({
  id,
  nickname,
  email,
  profile,
  isFollowing,
  isLoading = false,
  isChatLoading = false,
  canChat,
  onChatClick,
  onFollowToggle,
}: UserItemProps) {
  const handleChatClick = () => {
    if (canChat && !isChatLoading) {
      onChatClick(id, nickname); // nickname도 함께 전달
    }
  };

  const handleFollowClick = () => {
    if (!isLoading) {
      onFollowToggle(id);
    }
  };

  const getAvatarSrc = () => {
    return profile || defaultProfile;
  };

  return (
    <div className="flex items-center px-8 py-5 transition-colors duration-200 border-b border-gray-200 last:border-b-0 hover:bg-gray-50">
      {/* Avatar */}
      <div className="flex-shrink-0 w-12 h-12 mr-4 overflow-hidden rounded-full">
        <img
          src={getAvatarSrc()}
          alt={nickname}
          className="object-cover w-full h-full"
        />
      </div>

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <a
          href={`/members/${id}/projects`}
          className="block text-base font-semibold text-blue-600 hover:underline cursor-pointer mb-0.5"
        >
          {nickname}
        </a>
        <div className="text-sm text-gray-600">{email}</div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Chat Button */}
        {features.chat && <button
          onClick={handleChatClick}
          disabled={!canChat || isChatLoading}
          className={`px-4 py-2 rounded-md text-xs font-medium flex items-center gap-1 transition-all duration-200 ${
            canChat && !isChatLoading
              ? "bg-blue-600 text-white hover:bg-blue-700 border border-blue-600"
              : "bg-gray-600 text-white border border-gray-600 opacity-60 cursor-not-allowed"
          }`}
          title={canChat ? "" : "팔로우 후 채팅 가능"}
        >
          <div className="w-3 h-3">
            <ChatIcon />
          </div>
          {isChatLoading ? "처리중..." : "채팅"}
        </button>}

        {/* Follow Button */}
        <button
          onClick={handleFollowClick}
          disabled={isLoading}
          className={`px-4 py-2 rounded-md border text-xs font-medium transition-all duration-200 whitespace-nowrap ${
            isLoading
              ? "bg-gray-400 text-white border-gray-400 cursor-not-allowed"
              : isFollowing
              ? "bg-green-600 text-white border-green-600/40 hover:bg-red-600 hover:border-red-600/40"
              : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50 hover:border-gray-300"
          }`}
        >
          {isLoading ? "처리중..." : isFollowing ? "Following" : "Follow"}
        </button>
      </div>
    </div>
  );
}

export default UserItem;