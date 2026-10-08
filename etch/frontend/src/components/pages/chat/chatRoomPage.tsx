import { useEffect, useRef, useCallback } from "react";
import { useChatContext } from "../../../contexts/chatContext";
import ChatMessageList from "../../organisms/chat/chatMessageList";
import ChatInputArea from "../../organisms/chat/chatInputArea";

export default function ChatRoomPage() {
  const { messages, sendMessage, currentRoom, isLoading, markOthersMessagesAsRead } = useChatContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastReadMessageCountRef = useRef(0);

  // 읽음 처리를 위한 debounced 함수
  const debouncedMarkAsRead = useCallback(
    (roomId: string) => {
      const timer = setTimeout(() => {
        markOthersMessagesAsRead(roomId);
      }, 300);
      return () => clearTimeout(timer);
    },
    [markOthersMessagesAsRead]
  );

  // 메시지가 업데이트될 때마다 스크롤을 아래로 이동
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 채팅방이 변경될 때 ref 초기화
  useEffect(() => {
    if (currentRoom) {
      lastReadMessageCountRef.current = 0;
    }
  }, [currentRoom]);

  // 새로운 다른 사용자의 메시지가 도착했을 때만 읽음 처리
  useEffect(() => {
    if (!currentRoom || messages.length === 0) return;

    const othersMessages = messages.filter(msg => msg.sender === 'other');
    if (othersMessages.length > lastReadMessageCountRef.current) {
      lastReadMessageCountRef.current = othersMessages.length;
      const cleanup = debouncedMarkAsRead(currentRoom.roomId);
      return cleanup;
    }
  }, [messages, currentRoom, debouncedMarkAsRead]);

  const handleSendMessage = async (message: string) => {
    if (message.trim()) {
      await sendMessage(message);
    }
  };

  const handleFileUpload = () => {
    // TODO: 파일 업로드 로직 - 추후 구현
  };

  if (!currentRoom) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500">채팅방을 선택해주세요.</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500">메시지를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* 메시지 리스트 */}
      <div className="flex-1 overflow-y-auto p-2">
        <ChatMessageList messages={messages} />
        <div ref={messagesEndRef} />
      </div>

      {/* 입력 영역 */}
      <div className="border-t p-2">
        <ChatInputArea
          onSendMessage={handleSendMessage}
          onFileUpload={handleFileUpload}
        />
      </div>
    </div>
  );
}
