import type { CommentRequest } from '../../types/comment';
import { changedShowcase, copy, showcaseState } from '../state';
import { virtualMember, referenceDate } from '../data';
export const getCommentsByProjectId = async (projectId: number) => ({ count: (showcaseState.comments[projectId] ?? []).length, comments: copy(showcaseState.comments[projectId] ?? []) });
export const createComment = async (projectId: number, input: CommentRequest) => {
  const comments = showcaseState.comments[projectId] ??= [];
  const comment = { id: Math.max(4001, ...Object.values(showcaseState.comments).flat().map(item => item.id)) + 1, memberId: virtualMember.id, nickname: virtualMember.nickname, content: input.content, createdAt: `${referenceDate}T10:00:00`, isDeleted: false, profile: virtualMember.profile };
  comments.push(comment); changedShowcase(); return copy(comment);
};
export const deleteComment = async (projectId: number, commentId: number) => { showcaseState.comments[projectId] = (showcaseState.comments[projectId] ?? []).filter(item => item.id !== commentId); changedShowcase(); return { deletedId: commentId, success: true }; };
