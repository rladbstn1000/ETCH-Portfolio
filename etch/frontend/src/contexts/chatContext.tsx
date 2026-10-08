import { features } from "../config/features";
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { chatService } from '../services/chatService';
import { chatApi } from '../api/chatApi.tsx';
import { getCurrentUserId, getCurrentUserName, getAccessToken } from '../utils/userUtils';
import type { ChatRoom, UIChatRoom, UIChatMessage, WebSocketChatMessage } from '../types/chat';

interface ChatContextType {
  // 상태
  rooms: UIChatRoom[];
  currentRoom: ChatRoom | null;
  messages: UIChatMessage[];
  isConnected: boolean;
  isLoading: boolean;
  
  // 액션
  loadRooms: () => Promise<void>;
  selectRoom: (roomId: string) => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  leaveRoom: () => Promise<void>;
  markOthersMessagesAsRead: (roomId: string) => Promise<void>;
  temporarilyLeaveRoom: () => Promise<void>; // 🆕 추가
  permanentlyLeaveRoom: () => Promise<void>; // 🆕 추가
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [rooms, setRooms] = useState<UIChatRoom[]>([]);
  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<UIChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // WebSocket 연결 초기화
  useEffect(() => {
    if (!features.chat) return;
    const initializeWebSocket = async () => {
      try {
        const token = getAccessToken();
        await chatService.connect(token || undefined);
        setIsConnected(true);
      } catch (error) {
        console.error('WebSocket 연결 실패:', error);
        setIsConnected(false);
      }
    };

    initializeWebSocket();

    // 컴포넌트 언마운트시 연결 해제
    return () => {
      chatService.disconnect();
      setIsConnected(false);
    };
  }, []);

  // 채팅방 목록 로드
  const loadRooms = async () => {
    if (!features.chat) return;
    try {
      setIsLoading(true);
      const apiRooms = await chatApi.getRooms();
      
      // API 응답을 UI 형태로 변환 (새로운 응답 구조 반영)
      const uiRooms: UIChatRoom[] = apiRooms.map(room => ({
        id: room.roomId,
        name: room.displayName,           // displayName 사용
        lastMessage: room.lastMessage || '',
        time: room.createdAt ? new Date(room.createdAt).toLocaleTimeString('ko-KR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }) : '',
        unreadCount: room.unreadCount || 0
      }));
      
      setRooms(uiRooms);
    } catch (error) {
      console.error('채팅방 목록 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 채팅방 선택
  const selectRoom = async (roomId: string) => {
    try {
      setIsLoading(true);
      
      // 이전 방에서 나가기
      if (currentRoom) {
        await chatApi.exitRoom(currentRoom.roomId);
        chatService.unsubscribeFromRoom(currentRoom.roomId);
      }

      // 새 방 정보 가져오기 (새로운 응답 구조 사용)
      const roomInfo = await chatApi.getRoom(roomId);
      setCurrentRoom(roomInfo);

      // 방 입장
      await chatApi.enterRoom(roomId);

      // 이전 메시지 로드
      const apiMessages = await chatApi.getRoomMessages(roomId);
      const currentUserId = getCurrentUserId();
      
      const uiMessages: UIChatMessage[] = apiMessages.map(msg => ({
        id: msg.id?.toString() || Date.now().toString(),
        message: msg.message,
        sender: msg.senderId === currentUserId ? 'me' : 'other',
        time: new Date(msg.sentAt).toLocaleTimeString('ko-KR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        senderName: msg.senderId === currentUserId ? undefined : msg.senderNickname,
        unreadCount: msg.unreadCount
      }));
      
      setMessages(uiMessages);

      // WebSocket 구독
      chatService.subscribeToRoom(roomId, handleWebSocketMessage);

      // 다른 사용자의 메시지만 읽음 처리 (자신의 메시지는 제외)
      await markOthersMessagesAsRead(roomId);

    } catch (error) {
      console.error('채팅방 선택 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // WebSocket 메시지 처리
  const handleWebSocketMessage = (wsMessage: WebSocketChatMessage) => {
    if (wsMessage.type === 'TALK') {
      const currentUserId = getCurrentUserId();
      
      // 자신이 보낸 메시지는 이미 화면에 표시되어 있으므로 중복 추가 방지
      if (wsMessage.senderId === currentUserId) {
        // 임시 메시지를 실제 메시지로 교체
        setMessages(prevMessages => {
          const tempMessageIndex = prevMessages.findIndex(msg => 
            msg.sender === 'me' && 
            msg.message === wsMessage.message &&
            msg.id.startsWith('temp-')
          );
          
          if (tempMessageIndex >= 0) {
            const newMessages = [...prevMessages];
            newMessages[tempMessageIndex] = {
              ...newMessages[tempMessageIndex],
              id: wsMessage.messageId?.toString() || Date.now().toString(),
              unreadCount: wsMessage.unreadCount
            };
            return newMessages;
          }
          return prevMessages;
        });
      } else {
        // 다른 사용자의 메시지는 새로 추가
        const newMessage: UIChatMessage = {
          id: wsMessage.messageId?.toString() || Date.now().toString(),
          message: wsMessage.message,
          sender: 'other',
          time: new Date().toLocaleTimeString('ko-KR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          senderName: wsMessage.sender,
          unreadCount: wsMessage.unreadCount
        };
        
        setMessages(prevMessages => [...prevMessages, newMessage]);
      }
    }
  };

  // 🆕 임시 나가기 (ESC 키용 - 채팅방 목록으로 돌아가기)
  const temporarilyLeaveRoom = async () => {
    if (!currentRoom) return;

    try {
      // 🆕 임시 나가기 API 호출 (DB에서 참가자 제거하지 않음)
      await chatApi.temporarilyLeaveRoom(currentRoom.roomId);
      
      // WebSocket 구독만 해제
      chatService.unsubscribeFromRoom(currentRoom.roomId);
      
      // UI 상태 초기화
      setCurrentRoom(null);
      setMessages([]);
      
    } catch (error) {
      console.error('임시 나가기 실패:', error);
    }
  };

  // 🆕 완전 나가기 (설정에서 "나가기" 버튼용)
  const permanentlyLeaveRoom = async () => {
    if (!currentRoom) return;

    try {
      // 완전 나가기 API 호출 (DB에서 참가자 제거)
      await chatApi.exitRoom(currentRoom.roomId);
      
      // WebSocket 구독 해제
      chatService.unsubscribeFromRoom(currentRoom.roomId);
      
      // UI 상태 초기화
      setCurrentRoom(null);
      setMessages([]);
      
      // 채팅방 목록도 새로고침 (나간 방이 목록에서 사라져야 함)
      await loadRooms();
      
    } catch (error) {
      console.error('완전 나가기 실패:', error);
    }
  };

  // 메시지 전송
  const sendMessage = async (message: string) => {
    if (!currentRoom) return;
    
    const currentUserId = getCurrentUserId();
    const currentUserName = getCurrentUserName();
    
    if (!currentUserId || !currentUserName) {
      return;
    }

    // tempMessage를 try 블록 밖에서 선언
    const tempMessage: UIChatMessage = {
      id: `temp-${Date.now()}`, // 임시 ID
      message: message,
      sender: 'me',
      time: new Date().toLocaleTimeString('ko-KR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      senderName: undefined
    };

    try {
      // 메시지를 즉시 화면에 추가
      setMessages(prevMessages => [...prevMessages, tempMessage]);

      // WebSocket으로 메시지 전송
      chatService.sendMessage(currentRoom.roomId, currentUserId, currentUserName, message);
      
    } catch (error) {
      console.error('메시지 전송 실패:', error);
      // 실패시 임시 메시지 제거
      setMessages(prevMessages => 
        prevMessages.filter(msg => msg.id !== tempMessage.id)
      );
    }
  };

  // 방 나가기
  const leaveRoom = temporarilyLeaveRoom;

  // 다른 사용자의 메시지만 읽음 처리
  const markOthersMessagesAsRead = async (roomId: string) => {
    if (!roomId) return;

    try {
      const currentUserId = getCurrentUserId();
      
      // 다른 사용자가 보낸 메시지들 중 가장 최근 메시지 찾기
      const othersMessages = messages.filter(msg => parseInt(msg.id) && msg.sender === 'other');
      const lastOthersMessage = othersMessages[othersMessages.length - 1];
      
      if (lastOthersMessage) {
        // REST API로 읽음 처리
        await chatApi.markAsRead(roomId);

        // WebSocket으로도 읽음 상태 전송 (다른 사용자의 마지막 메시지 ID)
        const messageId = parseInt(lastOthersMessage.id);
        chatService.markAsRead(roomId, currentUserId, messageId);
      }
    } catch (error) {
      console.error('읽음 처리 실패:', error);
    }
  };

  const value: ChatContextType = {
    rooms,
    currentRoom,
    messages,
    isConnected,
    isLoading,
    temporarilyLeaveRoom, // 명시적 임시 나가기
    permanentlyLeaveRoom, // 명시적 완전 나가기
    loadRooms,
    selectRoom,
    sendMessage,
    leaveRoom,
    markOthersMessagesAsRead,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
