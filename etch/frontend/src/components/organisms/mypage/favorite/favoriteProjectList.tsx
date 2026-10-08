import { useState, useEffect } from "react";
import type { FavoriteProjectProps } from "../../../atoms/list";
import FavoriteProject from "../../../molecules/mypage/favorite/favoriteProject";
import type { ProjectData } from "../../../../types/project/projectDatas";
import ProjectModal from "../../../common/projectModal";
import { Link } from "react-router";
import { getLikedProjects, getProjectById } from "../../../../api/projectApi";

interface Props {
  titleText: string;
  subText: string;
  sliceCount: number;
  favoriteData?: FavoriteProjectProps[];
  mockProjects?: ProjectData[]; // 🎯 타입 변경
}

interface LikedProjectResponse {
  id: number;
  title: string;
  nickname: string;
  content: string;
  thumbnailUrl: string;
  viewCount: number;
  likeCount: number;
  likedByMe?: boolean; // 🎯 추가
}

function FavoriteProjectList({
  titleText,
  subText,
  sliceCount,
  favoriteData: propFavoriteData,
  mockProjects: propMockProjects,
}: Props) {
  const [favoriteData, setFavoriteData] = useState<FavoriteProjectProps[]>([]);
  const [mockProjects, setMockProjects] = useState<ProjectData[]>([]); // 🎯 타입 변경
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🎯 모달 상태를 ProjectData로 변경
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchLikedProjects = async () => {
      try {
        setLoading(true);

        if (propFavoriteData && propMockProjects) {
          setFavoriteData(propFavoriteData);
          setMockProjects(propMockProjects);
        } else {
          const likedProjects: LikedProjectResponse[] =
            await getLikedProjects();

          const convertedFavoriteData: FavoriteProjectProps[] =
            likedProjects.map((project) => ({
              id: project.id,
              title: project.title,
              nickname: project.nickname,
              thumbnailUrl: project.thumbnailUrl,
              type: "project" as const,
              viewCount: project.viewCount,
              likeCount: project.likeCount,
            }));

          // 🎯 ProjectData 형태로 변환 (필수 필드들 모두 포함)
          const convertedMockProjects: ProjectData[] = likedProjects.map(
            (project) => ({
              id: project.id,
              title: project.title,
              content: project.content || "좋아요한 프로젝트입니다",
              thumbnailUrl: project.thumbnailUrl,
              youtubeUrl: "",
              viewCount: project.viewCount,
              projectCategory: "",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              isDeleted: false,
              githubUrl: "",
              isPublic: true,
              likeCount: project.likeCount,
              likedByMe: true, // 🎯 좋아요한 프로젝트이므로 true
              nickname: project.nickname,
              commentCount: 0,
              popularityScore: 0,
              member: { id: 1, nickname: project.nickname },
              files: [],
              projectTechs: [],
            })
          );

          setFavoriteData(convertedFavoriteData);
          setMockProjects(convertedMockProjects);
        }
      } catch (error: any) {
        console.error("좋아요한 프로젝트 로딩 실패:", error);
        // 400 에러는 데이터가 없음을 의미하므로 빈 배열로 처리
        if (error.response?.status === 400) {
          setFavoriteData([]);
          setMockProjects([]);
        } else {
          console.error("예상치 못한 에러:", error);
          setError("좋아요한 프로젝트를 불러오는데 실패했습니다.");
          setFavoriteData([]);
          setMockProjects([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLikedProjects();
  }, [propFavoriteData, propMockProjects]);

  // 카드 클릭 핸들러
  const handleCardClick = async (projectId: number) => {
    try {
      const detailProject = await getProjectById(projectId);
      setSelectedProject(detailProject);
      setIsModalOpen(true);
    } catch (error) {
      console.error("프로젝트 상세 정보 로딩 실패:", error);
      const project = mockProjects.find((p) => p.id === projectId);
      if (project) {
        setSelectedProject(project);
        setIsModalOpen(true);
      }
    }
  };

  // 모달 닫기 핸들러
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProject(null);
  };

  // 🎯 프로젝트 업데이트 핸들러 추가
  const handleProjectUpdate = (updatedProject: ProjectData) => {
    setSelectedProject(updatedProject);
    // 목록에서도 업데이트
    setMockProjects((prevProjects) =>
      prevProjects.map((project) =>
        project.id === updatedProject.id ? updatedProject : project
      )
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-fit">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(sliceCount)].map((_, index) => (
              <div key={index} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-[500px] flex flex-col">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">
            {titleText} ({favoriteData.length})
          </h1>
          <p className="text-sm text-gray-500">{subText}</p>
        </div>
      </div>

      {error && (
        <div className="text-center py-4 flex-shrink-0">
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      )}

      {/* List Section - 스크롤 가능 */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {favoriteData.length > 0 ? (
            favoriteData
              .map((data) => (
                <FavoriteProject
                  key={data.id}
                  {...data}
                  onCardClick={handleCardClick}
                />
              ))
          ) : (
            <div className="col-span-full text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">💝</span>
              </div>
              <p className="text-gray-500 text-base font-medium mb-2">
                좋아요한 프로젝트가 없습니다
              </p>
              <p className="text-gray-400 text-sm mb-4">
                관심있는 프로젝트에 좋아요를 눌러보세요
              </p>
              <Link to="/projects">
                <button className="bg-[#007DFC] hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm">
                  프로젝트 둘러보기
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* 🎯 프로젝트 모달 - onProjectUpdate 추가 */}
      {isModalOpen && selectedProject && (
        <ProjectModal
          project={selectedProject}
          onClose={handleCloseModal}
          onProjectUpdate={handleProjectUpdate}
        />
      )}
    </div>
  );
}

export default FavoriteProjectList;
