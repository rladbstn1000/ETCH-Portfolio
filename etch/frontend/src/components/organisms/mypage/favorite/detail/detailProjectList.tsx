import { useState } from "react";
import type { FavoriteProjectProps } from "../../../../atoms/list";
import FavoriteProjectCard from "../../../../molecules/mypage/favorite/detail/favoriteProjectCard";
import ProjectModal from "../../../../common/projectModal";
import type { ProjectData } from "../../../../../types/project/projectDatas";

interface Props {
  favoriteData: FavoriteProjectProps[];
  mockProjects: ProjectData[]; // 🎯 타입 변경
  onProjectUpdate?: (updatedProject: ProjectData) => void; // 🎯 추가
}

function DetailProjectList({
  favoriteData,
  mockProjects,
  onProjectUpdate,
}: Props) {
  const [visibleCount, setVisibleCount] = useState(10);
  const hasMore = favoriteData.length > visibleCount;

  const visibleProjects = favoriteData.slice(0, visibleCount);

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 10);
  };

  // 🎯 모달 상태를 ProjectData로 변경
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 카드 클릭 핸들러
  const handleCardClick = (projectId: number) => {
    const project = mockProjects.find((p) => p.id === projectId);
    if (project) {
      setSelectedProject(project);
      setIsModalOpen(true);
    }
  };

  // 모달 닫기 핸들러
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProject(null);
  };

  // 🎯 프로젝트 업데이트 핸들러 추가
  const handleProjectUpdate = (updatedProject: ProjectData) => {
    setSelectedProject(updatedProject); // 모달 내 프로젝트 상태 업데이트
    // 부모 컴포넌트에도 알림
    onProjectUpdate?.(updatedProject);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Project Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {visibleProjects.map((data) => (
          <div key={data.id} className="w-full">
            <FavoriteProjectCard {...data} onCardClick={handleCardClick} />
          </div>
        ))}
      </div>

      {/* 🎯 프로젝트 모달 - onProjectUpdate 추가 */}
      {isModalOpen && selectedProject && (
        <ProjectModal
          project={selectedProject}
          onClose={handleCloseModal}
          onProjectUpdate={handleProjectUpdate} // 추가
        />
      )}

      {/* 더보기 버튼 */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <button
            onClick={handleLoadMore}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-3 rounded-lg font-semibold transition-colors border border-gray-300"
          >
            더보기 ({favoriteData.length - visibleCount}개 더 보기)
          </button>
        </div>
      )}

      {/* 모든 프로젝트를 다 보여준 경우 */}
      {!hasMore && favoriteData.length > 10 && (
        <div className="text-center text-gray-500 pt-4">
          모든 프로젝트를 확인했습니다 ({favoriteData.length}개)
        </div>
      )}
    </div>
  );
}

export default DetailProjectList;
