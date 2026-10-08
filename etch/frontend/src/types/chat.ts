// 채팅방 관련 타입들 (최신 API 명세 반영)
export interface ChatRoom {
  roomId: string;
  displayName: string;        // 사용자별로 다르게 표시되는 채팅방 이름
  chatType: 'GROUP' | 'DIRECT';
  otherUserId?: number;       // 1:1 채팅방의 경우 상대방 ID
  createdAt: string;          // ISO 8601 format
  lastMessage?: string;       // 마지막 메시지 (목록 조회 시)
  unreadCount?: number;       // 안 읽은 메시지 수 (목록 조회 시)
}

export interface ChatMessage {
  id?: number;
  roomId: string;
  senderId: number;
  senderNickname: string;
  message: string;
  unreadCount?: number;
  sentAt: string;
}

// WebSocket 메시지 타입들
export type WebSocketMessageType = 'ENTER' | 'TALK' | 'READ';

export interface WebSocketChatMessage {
  type: WebSocketMessageType;
  roomId: string;
  senderId: number;
  sender: string;
  message: string;
  messageId?: number;
  unreadCount?: number;
}

export interface WebSocketReadMessage {
  roomId: string;
  memberId: number;
  messageId?: number;
}

// UI용 채팅 메시지 타입 (기존 컴포넌트와 호환)
export interface UIChatMessage {
  id: string;
  message: string;
  sender: "me" | "other";
  time: string;
  senderName?: string;
  unreadCount?: number; // 읽지 않은 사용자 수
}

// 1:1 채팅방 생성 요청 타입 (새로운 API)
export interface DirectChatRequest {
  targetUserId: number;       // 채팅할 상대방 ID
  myNickname: string;         // 요청자(현재 로그인한 유저)의 닉네임
  targetNickname: string;     // 상대방의 닉네임
}

// UI용 채팅방 타입 (기존 컴포넌트와 호환)
export interface UIChatRoom {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  profileImage?: string;
  unreadCount?: number;
}
