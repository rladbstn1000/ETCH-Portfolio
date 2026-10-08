import type { ChatRoomItemProps } from "../../atoms/listItem";
import defaultProfile from "../../../assets/default-profile.png";

export default function ChatRoomItem({
  id,
  name,
  lastMessage,
  time,
  profileImage,
  unreadCount,
  onClick,
}: ChatRoomItemProps) {
  return (
    <div 
      onClick={() => onClick?.(id)}
      className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
    >
      {/* 프로필 이미지 영역 - 고정 크기 */}
      <div className="w-10 h-10 mr-3 flex-shrink-0">
        <img 
          src={profileImage || defaultProfile} 
          alt="profile" 
          className="w-full h-full rounded-full object-cover"
        />
      </div>
      
      {/* 메인 컨텐츠 영역 */}
      <div className="flex-1 min-w-0">
        {/* 이름과 시간 */}
        <div className="flex justify-between items-center mb-1">
          <span className="font-medium text-gray-900 truncate">{name}</span>
          <span className="text-xs text-gray-500 ml-2 flex-shrink-0">{time}</span>
        </div>
        
        {/* 메시지와 읽지않음 배지 */}
        <div className="flex items-center">
          <span className="text-sm text-gray-600 truncate flex-1 min-w-0">
            {lastMessage}
          </span>
          {unreadCount && unreadCount > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-5 h-5 flex items-center justify-center flex-shrink-0">
              {unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
