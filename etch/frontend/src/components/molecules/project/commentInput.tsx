import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import useUserStore from "../../../store/userStore";

interface CommentInputProps {
  onSubmit: (content: string) => void;
  isSubmitting?: boolean;
}

function CommentInput({ onSubmit, isSubmitting = false }: CommentInputProps) {
  const [content, setContent] = useState("");
  const { isLoggedIn } = useUserStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 로그인 체크
    if (!isLoggedIn) {
      alert("댓글을 작성하려면 로그인이 필요합니다.");
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    
    if (content.trim() && !isSubmitting) {
      onSubmit(content.trim());
      setContent("");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex gap-2 items-center">
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={isLoggedIn ? "댓글을 입력하세요..." : "로그인 후 댓글을 작성할 수 있습니다."}
            className="w-full p-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            rows={2}
            disabled={isSubmitting || !isLoggedIn}
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting || !isLoggedIn}
          className={`
            font-medium px-5 py-2.5 rounded-md text-base 
            flex items-center justify-center h-10 min-w-[64px]
            ${isLoggedIn 
              ? 'bg-blue-500 hover:bg-blue-600 text-white' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          {isLoggedIn ? '등록' : '로그인 필요'}
        </button>
      </div>
    </form>
  );
}

export default CommentInput;
