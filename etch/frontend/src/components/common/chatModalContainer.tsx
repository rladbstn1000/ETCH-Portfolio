import { useState, useEffect, useCallback } from "react";
import { ChatProvider, useChatContext } from "../../contexts/chatContext";
import { useModalContext } from "../../contexts/modalContext";
import ChatListPage from "../pages/chat/chatListPage";
import ChatRoomPage from "../pages/chat/chatRoomPage";
import ChatListHeader from "../molecules/modal/chatListHeader";
import ChatRoomHeader from "../molecules/modal/chatRoomHeader";

interface ChatModalContainerProps {
  onClose: () => void;
}

function ChatModalContent({ onClose }: ChatModalContainerProps) {
  const [modalState, setModalState] = useState<'list' | 'room'>('list');
  const { currentRoom, temporarilyLeaveRoom, selectRoom } = useChatContext(); // 🆕 수정
  const { targetRoomId } = useModalContext();

  const handleRoomSelect = async (_roomId: string, _roomName: string) => {
    setModalState('room');
  };

  // 🆕 개선된 "목록으로 돌아가기" 함수
  const handleBackToList = async () => {
    // 임시 나가기 사용 (DB에서 참가자 제거하지 않음)
    await temporarilyLeaveRoom();
    setModalState('list');
  };

  // 🆕 개선된 ESC 키 이벤트 핸들러
  const handleEscKey = useCallback(async () => {
    if (modalState === 'room') {
      // 채팅방에서 ESC: 임시 나가기로 채팅방 목록으로 돌아가기
      // DB에서 참가자를 제거하지 않음
      await handleBackToList();
    } else {
      // 채팅방 목록에서 ESC: 모달 닫기
      onClose();
    }
  }, [modalState, onClose, handleBackToList]);

  // ESC 키 이벤트 리스너 등록
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleEscKey();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleEscKey]);

  // targetRoomId가 있을 때 해당 채팅방으로 자동 이동
  useEffect(() => {
    if (targetRoomId && !currentRoom) {
      selectRoom(targetRoomId);
    }
  }, [targetRoomId, currentRoom, selectRoom]);

  // currentRoom 상태에 따라 모달 상태 동기화
  useEffect(() => {
    if (currentRoom) {
      setModalState('room');
    } else {
      setModalState('list');
    }
  }, [currentRoom]);

  return (
    <div className="h-full flex flex-col">
      {modalState === 'list' && (
        <>
          <ChatListHeader onClose={onClose} />
          <div className="flex-1 overflow-hidden">
            <ChatListPage onRoomSelect={handleRoomSelect} />
          </div>
        </>
      )}
      
      {modalState === 'room' && currentRoom && (
        <>
          <ChatRoomHeader 
            roomName={currentRoom.displayName} 
            onBack={handleBackToList} // 🆕 임시 나가기 사용
          />
          <div className="flex-1 overflow-hidden">
            <ChatRoomPage />
          </div>
        </>
      )}
    </div>
  );
}

export default function ChatModalContainer({ onClose }: ChatModalContainerProps) {
  return (
    <ChatProvider>
      <ChatModalContent onClose={onClose} />
    </ChatProvider>
  );
}