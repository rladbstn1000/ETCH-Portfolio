import { useState } from "react";
import type { ProjectData } from "../../../types/project/projectDatas.ts";
import { getProjectById } from "../../../api/projectApi.tsx";
import ProjectCard from "../../molecules/project/projectCard.tsx";
import ProjectModal from "../../common/projectModal.tsx";

interface Props {
  projects: ProjectData[];
  onProjectUpdate?: (updatedProject: ProjectData) => void; // 🎯 업데이트 콜백 추가
}

function UserProjectList({ projects, onProjectUpdate }: Props) {
  const [visibleCount, setVisibleCount] = useState(10);
  const sortedProjects = projects;
  const hasMore = sortedProjects.length > visibleCount;

  // 모달 상태 관리
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const visibleProjects = sortedProjects.slice(0, visibleCount);

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 10);
  };

  // 카드 클릭 핸들러
  const handleCardClick = async (projectId: number) => {
    try {
      const detailProject = await getProjectById(projectId);
      setSelectedProject(detailProject);
      setIsModalOpen(true);
    } catch (error) {
      console.error("상세 정보 로딩 실패:", error);
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
      {projects.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📂</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            조건에 맞는 프로젝트가 없습니다
          </h3>
          <p className="text-gray-600">다른 검색 조건을 시도해보세요.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {visibleProjects.map((project) => (
              <ProjectCard
                key={project.id}
                type="project"
                id={project.id}
                title={project.title}
                likedByMe={project.likedByMe}
                nickname={project.nickname}
                viewCount={project.viewCount}
                likeCount={project.likeCount}
                thumbnailUrl={project.thumbnailUrl}
                onCardClick={handleCardClick}
              />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-4">
              <button
                onClick={handleLoadMore}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-3 rounded-lg font-semibold transition-colors border border-gray-300"
              >
                더보기 ({sortedProjects.length - visibleCount}개 더 보기)
              </button>
            </div>
          )}

          {!hasMore && projects.length > 10 && (
            <div className="text-center text-gray-500 pt-4">
              모든 프로젝트를 확인했습니다 ({projects.length}개)
            </div>
          )}
        </>
      )}

      {/* 🎯 모달에 업데이트 핸들러 전달 */}
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

export default UserProjectList;
