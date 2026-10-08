import type { UIChatRoom } from "../../../types/chat";
import ChatRoomItem from "../../molecules/chat/chatRoomItem";

interface ChatRoomListProps {
  chatRooms: UIChatRoom[];
  onRoomClick: (roomId: string) => void;
}

export default function ChatRoomList({
  chatRooms,
  onRoomClick,
}: ChatRoomListProps) {
  return (
    <div>
      {chatRooms.length === 0 ? (
        <div className="p-4 text-center text-gray-500">
          채팅방이 없습니다
        </div>
      ) : (
        chatRooms.map((room) => (
          <ChatRoomItem
            key={room.id}
            id={room.id}
            name={room.name}
            lastMessage={room.lastMessage}
            time={room.time}
            profileImage={room.profileImage}
            unreadCount={room.unreadCount}
            onClick={onRoomClick}
          />
        ))
      )}
    </div>
  );
}
