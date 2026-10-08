import type { UIChatMessage } from "../../../types/chat";

interface ChatMessageItemProps extends UIChatMessage {}

export default function ChatMessageItem({
  message,
  sender,
  time,
  senderName,
  unreadCount,
}: ChatMessageItemProps) {
  const isMe = sender === 'me';
  
  return (
    <div className={`mb-4 flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
      {/* 내가 보낸 메시지인 경우 읽음 표시를 메시지 왼쪽에 */}
      {isMe && unreadCount !== undefined && (
        <div className="text-xs text-gray-500 pb-1 min-w-fit chat-unread-count">
          {unreadCount > 0 ? unreadCount : ''}
        </div>
      )}
      
      <div className={`max-w-xs px-4 py-2 rounded-2xl ${
        isMe 
          ? 'bg-blue-500 text-white' 
          : 'bg-gray-200 text-gray-900'
      }`}>
        {sender === 'other' && senderName && (
          <div className="text-xs text-gray-500 mb-1">{senderName}</div>
        )}
        <div className="text-sm">{message}</div>
        <div className={`text-xs mt-1 ${
          isMe ? 'text-blue-100' : 'text-gray-500'
        }`}>
          {time}
        </div>
      </div>
      
      {/* 상대방이 보낸 메시지인 경우 시간만 표시 */}
      {!isMe && (
        <div className="text-xs text-gray-500 pb-1">
          {/* 상대방 메시지는 읽음 표시 없음 */}
        </div>
      )}
    </div>
  );
}