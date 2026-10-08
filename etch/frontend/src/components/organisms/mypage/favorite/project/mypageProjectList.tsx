import { useState } from "react";
import ProjectModal from "../../../../common/projectModal";
import MyProjectCard from "../../../../molecules/mypage/project/myProjectCard";
import type { ProjectData } from "../../../../../types/project/projectDatas";
import { getProjectById } from "../../../../../api/projectApi"; // 🎯 추가

interface Props {
  mockProjects: ProjectData[]; // 🎯 타입 변경
  onProjectUpdate?: (updatedProject: ProjectData) => void; // 🎯 추가
}

function MypageProjectList({ mockProjects, onProjectUpdate }: Props) {
  const [visibleCount, setVisibleCount] = useState(10);
  const hasMore = mockProjects.length > visibleCount;

  // 🎯 모달 상태를 ProjectData로 변경
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const visibleProjects = mockProjects.slice(0, visibleCount);

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 10);
  };

  // 🎯 카드 클릭 핸들러 - API로 최신 데이터 가져오기
  const handleCardClick = async (projectId: number) => {
    try {
      const detailProject = await getProjectById(projectId);
      setSelectedProject(detailProject);
      setIsModalOpen(true);
    } catch (error) {
      console.error("상세 정보 로딩 실패:", error);
      // 실패 시 기존 데이터라도 보여주기
      const project = mockProjects.find((p) => p.id === projectId);
      if (project) {
        setSelectedProject(project);
        setIsModalOpen(true);
      }
    }
  };

  // 🎯 모달 닫기 시 프로젝트 데이터 업데이트
  const handleCloseModal = () => {
    // 선택된 프로젝트가 변경되었다면 부모 컴포넌트에 알림
    if (selectedProject && onProjectUpdate) {
      onProjectUpdate(selectedProject);
    }

    setIsModalOpen(false);
    setSelectedProject(null);
  };

  // 🎯 모달에서 프로젝트 업데이트 핸들러
  const handleProjectUpdate = (updatedProject: ProjectData) => {
    setSelectedProject(updatedProject);
  };

  return (
    <div className="space-y-8">
      {/* 프로젝트 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {visibleProjects.map((project) => (
          <MyProjectCard
            key={project.id}
            id={project.id}
            title={project.title}
            content={project.content}
            thumbnailUrl={project.thumbnailUrl}
            viewCount={project.viewCount}
            likeCount={project.likeCount}
            likedByMe={project.likedByMe}
            nickname={project.nickname}
            type="project"
            onCardClick={handleCardClick}
          />
        ))}
      </div>

      {/* 더보기 버튼 */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <button
            onClick={handleLoadMore}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-3 rounded-lg font-semibold transition-colors border border-gray-300"
          >
            더보기 ({mockProjects.length - visibleCount}개 더 보기)
          </button>
        </div>
      )}

      {/* 모든 프로젝트를 다 보여준 경우 */}
      {!hasMore && mockProjects.length > 10 && (
        <div className="text-center text-gray-500 pt-4">
          모든 프로젝트를 확인했습니다 ({mockProjects.length}개)
        </div>
      )}

      {/* 🎯 프로젝트 모달 - onProjectUpdate 추가 */}
      {isModalOpen && selectedProject && (
        <ProjectModal
          project={selectedProject}
          onClose={handleCloseModal}
          onProjectUpdate={handleProjectUpdate} // 프로젝트 업데이트 핸들러 전달
        />
      )}
    </div>
  );
}

export default MypageProjectList;
