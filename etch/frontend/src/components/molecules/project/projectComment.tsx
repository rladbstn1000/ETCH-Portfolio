import type { Comment } from "../../../types/comment";
import { useNavigate } from "react-router";

interface ProjectCommentProps {
  comment: Comment;
  currentUserId?: number; // 현재 로그인한 사용자 ID
  onDelete?: (commentId: number) => void;
}

function ProjectComment({ 
  comment, 
  currentUserId, 
  onDelete
}: ProjectCommentProps) {
  const navigate = useNavigate();
  
  // 본인 댓글인지 확인 (currentUserId와 comment.memberId 비교)
  const isAuthor = currentUserId === comment.memberId;
  
  // 디버깅용 로그 (권한 확인을 위해 유지)
  
  // 시간 포맷팅 함수
  const formatDateTime = (timeString: string) => {
  try {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Seoul', // KST 고정
    }).format(new Date(timeString));
  } catch {
    return timeString;
  }
};

  // 사용자 프로필 페이지로 이동
  const handleProfileClick = () => {
    const memberId = comment.memberId;
    
    // 본인 댓글인지 확인
    if (currentUserId === memberId) {
      // 본인 댓글이면 마이페이지로 이동
      navigate('/mypage');
    } else {
      // 다른 사용자 댓글이면 해당 사용자의 프로필 페이지로 이동
      navigate(`/members/${memberId}/projects`);
    }
  };

  const handleDelete = () => {
    if (onDelete && window.confirm("댓글을 삭제하시겠습니까?")) {
      onDelete(comment.id);
    }
  };

  return (
    <div className="flex gap-3 p-4 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
      {/* 프로필 이미지 */}
      <div className="flex-shrink-0">
        <button
          onClick={handleProfileClick}
          className="hover:opacity-80 transition-opacity duration-200"
          title={`${comment.nickname}의 프로필 보기`}
        >
          <img
            src={comment.profile || "/src/assets/default-profile.png"}
            alt={`${comment.nickname}의 프로필`}
            className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
          />
        </button>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleProfileClick}
              className="font-semibold text-gray-900 text-sm hover:text-blue-600 transition-colors duration-200 cursor-pointer"
              title={`${comment.nickname}의 프로필 보기`}
            >
              {comment.nickname}
            </button>
            <span className="text-xs text-gray-500">
              {formatDateTime(comment.createdAt)}
            </span>

          </div>
          
          {isAuthor && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleDelete}
                className="px-3 py-1 text-xs bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors duration-200"
              >
                삭제
              </button>
            </div>
          )}
        </div>

        <div className="text-gray-700 text-sm leading-relaxed break-words mb-3">
          {comment.content}
        </div>
      </div>
    </div>
  );
}

export default ProjectComment;

