import type { UserProfile } from "../../types/userProfile";

// 리스트 아이템 기본 인터페이스
export interface BaseListItemProps {
  id: string;
  onClick?: (id: string) => void;
}

// 채팅 아이템 전용
export interface ChatRoomItemProps extends BaseListItemProps {
  name: string;
  lastMessage: string;
  time: string;
  profileImage?: string;
  unreadCount?: number;
}

// 채팅 메시지 아이템 전용
export interface ChatMessageItemProps extends BaseListItemProps {
  message: string;
  sender: "me" | "other";
  time: string;
  senderName?: string;
}

// 채용정보 아이템 전용 - API 구조에 맞게 수정
export interface JobItemProps extends BaseListItemProps {
  title: string; // 채용공고 제목
  companyName: string;
  companyId: number;
  regions: string[];
  industries: string[];
  jobCategories: string[];
  workType: string;
  educationLevel: string;
  openingDate: string;
  expirationDate: string;
}

// 마이페이지 대시보드 문서 아이템 전용
export interface DocumentItemProps extends BaseListItemProps {
  updatedAt: string;
  introduce?: string; // 한줄소개를 위한 필드 추가
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void; // Add onEdit prop
}

// 지원현황 아이템 전용 - AppliedJobListResponse에 맞춤
export interface ApplicationItemProps extends BaseListItemProps {
  appliedJobId: number; // 지원 ID
  jobId: number; // 공고 ID
  companyId: number; // 회사 ID
  title: string; // 공고 제목
  companyName: string; // 회사명
  openingDate: string; // LocalDateTime -> ISO string
  closingDate: string; // expirationDate -> ISO string
  status: string; // ApplyStatusType.name() -> string
  statusText?: string; // UI에서 표시할 한국어 상태명 (optional)
  onStatusChange?: (id: string) => void;
  onDelete?: (id: string) => void;
}

// 마감일 아이템 전용
export interface DeadlineItemProps extends BaseListItemProps {
  company: string;
  position: string;
  dueDate: string;
  daysLeft: number;
  urgency: "urgent" | "warning";
}

// 사용자 아이템 전용 - 수정된 버전
export interface UserItemProps extends UserProfile {
  isFollowing: boolean;
  isLoading?: boolean;
  isChatLoading?: boolean; // 채팅 로딩 상태 추가
  canChat: boolean;
  onChatClick: (userId: number, targetNickname: string) => void; // 파라미터 수정
  onFollowToggle: (userId: number) => void;
}