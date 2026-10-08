import { features, CHAT_API } from "../config/features";
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type { WebSocketChatMessage, WebSocketReadMessage } from '../types/chat';

export class ChatService {
  private stompClient: Client | null = null;
  private subscriptions: Map<string, any> = new Map();

  // WebSocket 연결 - 운영 환경
  connect(token?: string): Promise<void> {
    if (!features.chat) return Promise.reject(new Error("채팅이 비활성화되어 있습니다."));
    return new Promise((resolve, reject) => {
      this.stompClient = new Client({
        webSocketFactory: () => new SockJS(`${CHAT_API}/ws-stomp`),
        connectHeaders: token ? {
          Authorization: `Bearer ${token}`
        } : {},
        onConnect: () => {
          resolve();
        },
        onStompError: (frame) => {
          console.error('STOMP 에러:', frame);
          reject(frame);
        },
        onWebSocketError: (error) => {
          console.error('WebSocket 에러:', error);
          reject(error);
        },
        onDisconnect: () => {
        },

        // 연결 재시도 설정 추가
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      });
      
      this.stompClient.activate();
    });
  }

  // WebSocket 연결 해제
  disconnect(): void {
    if (this.stompClient) {
      // 모든 구독 해제
      this.subscriptions.forEach((subscription) => {
        subscription.unsubscribe();
      });
      this.subscriptions.clear();
      
      this.stompClient.deactivate();
      this.stompClient = null;
    }
  }

  // 채팅방 구독
  subscribeToRoom(roomId: string, onMessageReceived: (message: WebSocketChatMessage) => void): void {
    if (this.stompClient && this.stompClient.connected) {
      // 이미 구독중인 방이면 기존 구독 해제
      if (this.subscriptions.has(roomId)) {
        this.subscriptions.get(roomId).unsubscribe();
      }

      const subscription = this.stompClient.subscribe(`/sub/chat/room/${roomId}`, (message) => {
        try {
          const chatMessage: WebSocketChatMessage = JSON.parse(message.body);
          onMessageReceived(chatMessage);
        } catch (error) {
        }
      });

      this.subscriptions.set(roomId, subscription);
    } else {
    }
  }

  // 채팅방 구독 해제
  unsubscribeFromRoom(roomId: string): void {
    if (this.subscriptions.has(roomId)) {
      this.subscriptions.get(roomId).unsubscribe();
      this.subscriptions.delete(roomId);
    }
  }

  // 메시지 전송
  sendMessage(roomId: string, senderId: number, sender: string, message: string): void {
    if (this.stompClient && this.stompClient.connected) {
      const chatMessage: WebSocketChatMessage = {
        type: 'TALK',
        roomId: roomId,
        senderId: senderId,
        sender: sender,
        message: message
      };
      
      this.stompClient.publish({
        destination: '/pub/chat/message',
        body: JSON.stringify(chatMessage)
      });
      
    } else {
    }
  }

  // 읽음 상태 전송
  markAsRead(roomId: string, memberId: number, messageId?: number): void {
    if (this.stompClient && this.stompClient.connected) {
      const readMessage: WebSocketReadMessage = {
        roomId: roomId,
        memberId: memberId,
        messageId: messageId
      };
      
      this.stompClient.publish({
        destination: '/pub/chat/read',
        body: JSON.stringify(readMessage)
      });
      
    } else {
    }
  }

  // 연결 상태 확인
  isConnected(): boolean {
    return this.stompClient?.connected ?? false;
  }
}

// 싱글톤 인스턴스
export const chatService = new ChatService();
