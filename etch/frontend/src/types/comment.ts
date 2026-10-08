// 댓글 관련 타입 정의
export interface Comment {
  id: number;
  memberId: number;
  nickname: string;
  content: string;
  createdAt: string;
  isDeleted: boolean;
  profile?: string;
}

export interface CommentListResponse {
  count: number;
  comments: Comment[];
}

export interface CommentRequest {
  content: string;
}

export interface CommentResponse {
  id: number;
  memberId: number;
  nickname: string;
  content: string;
  createdAt: string;
  isDeleted: boolean;
  profile?: string;
}

export interface CommentDeleteResponse {
  deletedId: number;
  success: boolean;
}
