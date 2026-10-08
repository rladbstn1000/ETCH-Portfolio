import { useState } from "react";
import ProcjectCard from "../../../molecules/project/projectCard.tsx";
import ProjectModal from "../../../common/projectModal.tsx";
import type { ProjectData } from "../../../../types/project/projectDatas";
import { getProjectById } from "../../../../api/projectApi.tsx";

interface Props {
  projects: ProjectData[];
  onProjectUpdate?: (updatedProject: ProjectData) => void; // 🎯 업데이트 콜백 추가
}

function ProjectListCard({ projects, onProjectUpdate }: Props) {
  const [detailError, setDetailError] = useState<number | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
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
      setDetailError(null); setDetailLoading(true);
      const detailProject = await getProjectById(projectId);
      setSelectedProject(detailProject);
      setIsModalOpen(true);
    } catch (error) {
      setDetailError(projectId);
    } finally {
      setDetailLoading(false);
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
      {detailLoading && <p role="status">프로젝트 상세를 불러오는 중입니다.</p>}
      {detailError !== null && <div role="alert" className="rounded border border-red-200 p-4"><p>상세 정보를 불러오지 못했습니다. 비공개·삭제된 프로젝트이거나 일시적인 오류일 수 있습니다.</p><button className="mt-2 text-blue-700 underline" onClick={() => void handleCardClick(detailError)}>상세 다시 시도</button></div>}
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
              <ProcjectCard
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

export default ProjectListCard;
