import { useState, useEffect } from "react";
import type { ProjectData } from "../../../types/project/projectDatas.ts";
import { getProjectById, getAllProjects } from "../../../api/projectApi.tsx";
import ProjectCard from "../../molecules/project/projectCard.tsx";
import ProjectModal from "../../common/projectModal.tsx";

// API 응답 타입 (백엔드 ProjectListDTO와 일치)
interface ProjectListResponse {
  id: number;
  title: string;
  thumbnailUrl: string;
  viewCount: number;
  likeCount: number;
  nickname: string;
  isPublic: boolean;
}

interface Props {
  projects?: ProjectData[]; // 선택적으로 변경
}

function HomeProjectCard({ projects: propProjects }: Props) {
  const [projects, setProjects] = useState<ProjectListResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(10);

  // 모달 상태 관리
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        if (propProjects) {
          // 프로젝트 리스트 페이지에서 사용할 때 (기존 방식)
          const convertedProjects = propProjects.map((p) => ({
            id: p.id,
            title: p.title,
            thumbnailUrl: p.thumbnailUrl,
            viewCount: p.viewCount,
            likeCount: p.likeCount || 0,
            nickname: p.nickname,
            isPublic: p.isPublic,
          }));
          setProjects(convertedProjects);
        } else {
          // 홈페이지에서 사용할 때 - 조회수 높은 순으로 4개
          const data: ProjectListResponse[] = await getAllProjects();

          const popularProjects = data
            .filter((project: ProjectListResponse) => project.isPublic === true)
            .sort(
              (a: ProjectListResponse, b: ProjectListResponse) =>
                b.viewCount - a.viewCount
            )
            .slice(0, 4); // 홈페이지용으로 4개만

          setProjects(popularProjects);
        }
      } catch (error) {
        console.error("프로젝트 데이터 로딩 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [propProjects]);

  // 로딩 상태
  if (loading) {
    const gridCols = propProjects
      ? "grid-cols-1 md:grid-cols-2"
      : "grid-cols-1 xs:grid-cols-2 sm:grid-cols-2";
    const itemCount = propProjects ? 6 : 4;

    return (
      <div className={`grid ${gridCols} gap-4`}>
        {[...Array(itemCount)].map((_, index) => (
          <div
            key={index}
            className="h-48 bg-gray-200 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  // 프로젝트 정렬 - 홈페이지에서는 이미 정렬됨, 리스트에서는 역순 정렬
  const sortedProjects = propProjects ? [...projects].reverse() : projects;
  const hasMore = sortedProjects.length > visibleCount;
  const visibleProjects = sortedProjects.slice(
    0,
    propProjects ? visibleCount : 4
  );

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

  // 모달 닫기 핸들러
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProject(null);
  };

  // 그리드 스타일 결정
  const gridCols = propProjects
    ? "grid-cols-1 md:grid-cols-2"
    : "grid-cols-1 xs:grid-cols-2 sm:grid-cols-2";

  return (
    <div className="space-y-8">
      {/* 프로젝트가 없는 경우 */}
      {projects.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📂</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {propProjects
              ? "조건에 맞는 프로젝트가 없습니다"
              : "등록된 프로젝트가 없습니다"}
          </h3>
          <p className="text-gray-600">
            {propProjects
              ? "다른 검색 조건을 시도해보세요."
              : "새로운 프로젝트를 등록해보세요."}
          </p>
        </div>
      ) : (
        <>
          {/* 프로젝트 카드 그리드 */}
          <div className={`grid ${gridCols} gap-4`}>
            {visibleProjects.map((project) => (
              <ProjectCard
                key={project.id}
                type="project"
                id={project.id}
                title={project.title}
                nickname={project.nickname}
                viewCount={project.viewCount}
                likeCount={project.likeCount}
                thumbnailUrl={project.thumbnailUrl}
                onCardClick={handleCardClick}
              />
            ))}
          </div>

          {/* 더보기 버튼 - 프로젝트 리스트에서만 표시 */}
          {propProjects && hasMore && (
            <div className="flex justify-center pt-4">
              <button
                onClick={handleLoadMore}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-3 rounded-lg font-semibold transition-colors border border-gray-300"
              >
                더보기 ({sortedProjects.length - visibleCount}개 더 보기)
              </button>
            </div>
          )}

          {/* 모든 프로젝트를 다 보여준 경우 */}
          {propProjects && !hasMore && projects.length > 10 && (
            <div className="text-center text-gray-500 pt-4">
              모든 프로젝트를 확인했습니다 ({projects.length}개)
            </div>
          )}
        </>
      )}

      {/* 프로젝트 모달 */}
      {isModalOpen && selectedProject && (
        <ProjectModal project={selectedProject} onClose={handleCloseModal} />
      )}
    </div>
  );
}

export default HomeProjectCard;
