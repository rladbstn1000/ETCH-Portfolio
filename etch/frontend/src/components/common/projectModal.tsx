import { useDialogFocus } from "../../hooks/useDialogFocus";
import { DEMO_MODE } from "../../config/demo";
import { useEffect } from "react";
import ProjectDetailComment from "../organisms/project/detail/projectDetailComment";
import type { ProjectData } from "../../types/project/projectDatas";
import ProjectDetailCard from "../organisms/project/detail/projectDetailCard";
// 🎯 필요한 API 함수들 import
import { likeProject, unlikeProject } from "../../api/projectApi";
import useUserStore from "../../store/userStore";

interface Props {
  project: ProjectData;
  onClose: () => void;
  onProjectUpdate?: (updatedProject: ProjectData) => void; // 🎯 optional prop 추가
}

function ProjectModal({ project, onClose, onProjectUpdate }: Props) {
  const dialog = useDialogFocus(onClose);
  const { memberInfo } = useUserStore();
  
  // ESC 키로 모달 닫기
  useEffect(() => {
    // 모달이 마운트될 때 body 스크롤을 막습니다.
    document.body.style.overflow = 'hidden';

    // 모달이 언마운트될 때 body 스크롤을 복원합니다.
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // 🎯 좋아요 처리 함수
  const handleLike = async () => {
    try {

      if (project.likedByMe) {
        await unlikeProject(project.id);

        // 상태 업데이트
        const updatedProject = {
          ...project,
          likedByMe: false,
          likeCount: project.likeCount - 1,
        };
        onProjectUpdate?.(updatedProject);
      } else {
        await likeProject(project.id);

        // 상태 업데이트
        const updatedProject = {
          ...project,
          likedByMe: true,
          likeCount: project.likeCount + 1,
        };
        onProjectUpdate?.(updatedProject);
      }
    } catch (error) {
      console.error("좋아요 처리 실패:", error);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div ref={dialog} role="dialog" aria-modal="true" aria-label={`프로젝트 상세: ${project.title}`} tabIndex={-1} className="bg-white rounded-xl flex w-[95vw] max-w-[1200px] h-[80vh] sm:h-[85vh] overflow-hidden shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          aria-label="모달 닫기"
        >
          ✕
        </button>
  
        <div className="flex h-full w-full flex-col overflow-y-auto gap-6 sm:flex-row sm:overflow-hidden">
          <div className={`${DEMO_MODE ? "w-full" : "sm:flex-[0_0_60%]"} min-w-0 flex flex-col p-6 sm:overflow-y-auto`}>
            <ProjectDetailCard project={project} onLike={handleLike} />
          </div>
          {!DEMO_MODE && <div className="flex-1 min-w-0 shrink-0 border-l border-gray-200 flex flex-col bg-gray-50 sm:overflow-hidden px-5 sm:px-8">
          <div className="pt-6 pb-5 flex flex-col h-full overflow-hidden">
            <ProjectDetailComment projectId={project.id} currentUserId={memberInfo?.id} />
          </div>
        </div>}
        </div>
      </div>
    </div>
  );
}

export default ProjectModal;
