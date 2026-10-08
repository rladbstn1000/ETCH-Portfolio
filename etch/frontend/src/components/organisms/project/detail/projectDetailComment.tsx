import { useState, useEffect } from "react";
import type { Comment } from "../../../../types/comment";
import ProjectComment from "../../../molecules/project/projectComment";
import CommentInput from "../../../molecules/project/commentInput";
import { getCommentsByProjectId, createComment, deleteComment } from "../../../../api/commentApi";

interface Props {
  projectId: number;
  currentUserId?: number;
}

function ProjectDetailComment({ projectId, currentUserId }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 댓글 목록 조회
  const fetchComments = async () => {
    try {
      // projectId 유효성 검증
      if (!projectId || isNaN(projectId)) {
        console.error("유효하지 않은 projectId:", projectId);
        return;
      }

      setIsLoading(true);
      const response = await getCommentsByProjectId(projectId);

      const sorted = [...response.comments].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setComments(sorted);
      setTotalCount(response.count);
    } catch (error) {
      console.error("댓글 조회 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 댓글 등록
  const handleSubmitComment = async (content: string) => {
    try {
      // projectId 유효성 검증
      if (!projectId || isNaN(projectId)) {
        console.error("유효하지 않은 projectId:", projectId);
        alert("프로젝트 정보를 불러올 수 없습니다.");
        return;
      }

      setIsSubmitting(true);
      const newComment = await createComment(projectId, { content });
      // 새 댓글을 목록 맨 위에 추가
      setComments(prev => [newComment, ...prev]);
      setTotalCount(prev => prev + 1);
    } catch (error) {
      console.error("댓글 등록 실패:", error);
      alert("댓글 등록에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 댓글 삭제
  const handleDeleteComment = async (commentId: number) => {
    try {
      // projectId 유효성 검증
      if (!projectId || isNaN(projectId)) {
        console.error("유효하지 않은 projectId:", projectId);
        alert("프로젝트 정보를 불러올 수 없습니다.");
        return;
      }

      await deleteComment(projectId, commentId);
      // 삭제된 댓글을 목록에서 제거
      setComments(prev => prev.filter(comment => comment.id !== commentId));
      setTotalCount(prev => prev - 1);
    } catch (error) {
      console.error("댓글 삭제 실패:", error);
      alert("댓글 삭제에 실패했습니다.");
    }
  };

  useEffect(() => {
    if (projectId && !isNaN(projectId)) {
      fetchComments();
    }
  }, [projectId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-gray-500">댓글을 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 pt-2">
        <h3 className="text-lg font-semibold text-gray-900">
          댓글 ({totalCount})
        </h3>
      </div>
      <div className="flex-shrink-0 pt-4 pb-3">
        <CommentInput onSubmit={handleSubmitComment} isSubmitting={isSubmitting} />
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto min-h-0 border-t border-gray-200 pt-4">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">댓글을 불러오는 중...</div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            아직 댓글이 없습니다. 첫 번째 댓글을 남겨보세요!
          </div>
        ) : (
          comments.map((comment) => (
            <ProjectComment
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              onDelete={handleDeleteComment}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default ProjectDetailComment;
