import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface ModalContextType {
  // 채팅 모달 상태
  showChatModal: boolean;
  targetRoomId: string | null;
  
  // 액션
  openChatModal: (roomId?: string) => void;
  closeChatModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModalContext = () => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModalContext must be used within a ModalProvider');
  }
  return context;
};

interface ModalProviderProps {
  children: ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [showChatModal, setShowChatModal] = useState(false);
  const [targetRoomId, setTargetRoomId] = useState<string | null>(null);

  const openChatModal = (roomId?: string) => {
    setTargetRoomId(roomId || null);
    setShowChatModal(true);
  };

  const closeChatModal = () => {
    setShowChatModal(false);
    setTargetRoomId(null);
  };

  const value: ModalContextType = {
    showChatModal,
    targetRoomId,
    openChatModal,
    closeChatModal,
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  );
};
