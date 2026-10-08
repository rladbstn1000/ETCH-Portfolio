import { authInstance } from "./instances";
import type { 
  CommentListResponse, 
  CommentRequest, 
  CommentResponse, 
  CommentDeleteResponse 
} from "../types/comment";

// 특정 프로젝트의 전체 댓글 조회
export const getCommentsByProjectId = async (projectId: number): Promise<CommentListResponse> => {
  const response = await authInstance.get(`/projects/${projectId}/comments`);
  return response.data.data;
};

// 댓글 등록
export const createComment = async (
  projectId: number, 
  commentData: CommentRequest
): Promise<CommentResponse> => {
  const response = await authInstance.post(`/projects/${projectId}/comments`, commentData);
  return response.data.data;
};

// 댓글 삭제
export const deleteComment = async (
  projectId: number, 
  commentId: number
): Promise<CommentDeleteResponse> => {
  const response = await authInstance.delete(`/projects/${projectId}/comments/${commentId}`);
  return response.data.data;
};
