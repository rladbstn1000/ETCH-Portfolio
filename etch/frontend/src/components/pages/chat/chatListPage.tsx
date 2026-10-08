import { useEffect } from "react";
import { useChatContext } from "../../../contexts/chatContext";
import ChatRoomList from "../../organisms/chat/chatRoomList";

interface ChatListPageProps {
  onRoomSelect?: (roomId: string, roomName: string) => void;
}

function ChatListPage({ onRoomSelect }: ChatListPageProps) {
  const { rooms, loadRooms, selectRoom, isLoading } = useChatContext();

  useEffect(() => {
    loadRooms();
  }, []);

  const handleRoomClick = async (roomId: string) => {
    const room = rooms.find((r) => r.id === roomId);
    if (room) {
      await selectRoom(roomId);
      onRoomSelect?.(roomId, room.name);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500">채팅방 목록을 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <ChatRoomList chatRooms={rooms} onRoomClick={handleRoomClick} />
    </div>
  );
}

export default ChatListPage;
