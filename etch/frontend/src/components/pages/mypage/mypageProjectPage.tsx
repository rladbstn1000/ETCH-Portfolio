import { Link } from "react-router";
import { useState, useEffect } from "react";
import PlusSVG from "../../svg/plusSVG";
import MypageProjectList from "../../organisms/mypage/favorite/project/mypageProjectList";
import {
  getMyProjects,
  getAllProjects,
  type MyProjectResponse,
} from "../../../api/projectApi";
import type { ProjectData } from "../../../types/project/projectDatas";
import type { ProjectCategoryEnum } from "../../../types/project/projectCategroyData";

// getAllProjects용 확장된 응답 타입
interface AllProjectResponse extends MyProjectResponse {
  content?: string;
  youtubeUrl?: string;
  githubUrl?: string;
  authorId?: number;
  projectCategory?: string;
  createdAt?: string;
  updatedAt?: string;
  likedByMe?: boolean;
}

// 사용자 정보 타입
interface UserInfo {
  id: number;
  nickname: string;
}

function MypageProjectPage() {
  const [myProjects, setMyProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  // JWT 토큰에서 사용자 정보 가져오는 함수
  const getUserInfoFromToken = (): UserInfo | null => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return null;

      const base64Payload = token.split(".")[1];
      const payload = JSON.parse(atob(base64Payload));

      return {
        id: payload.id || 0,
        nickname: payload.nickname || "",
      };
    } catch (error) {
      console.error("JWT 토큰 디코딩 실패:", error);
      return null;
    }
  };

  // MyProjectResponse를 ProjectData로 변환
  const transformMyProjectToProjectData = (
    myProject: MyProjectResponse,
    currentUserId: number
  ): ProjectData => ({
    id: myProject.id,
    title: myProject.title,
    content: "프로젝트 상세 내용을 확인해보세요", // MyProjectResponse에는 content가 없음
    thumbnailUrl: myProject.thumbnailUrl || "", // null을 빈 문자열로 변환
    youtubeUrl: "", // MyProjectResponse에는 youtubeUrl이 없음
    viewCount: myProject.viewCount,
    projectCategory: "" as ProjectCategoryEnum, // MyProjectResponse에는 category가 없음
    createdAt: new Date().toISOString(), // MyProjectResponse에는 createdAt이 없음
    updatedAt: new Date().toISOString(), // MyProjectResponse에는 updatedAt이 없음
    isDeleted: false,
    githubUrl: "", // MyProjectResponse에는 githubUrl이 없음
    isPublic: myProject.isPublic,
    likeCount: myProject.likeCount,
    likedByMe: false, // MyProjectResponse에는 likedByMe가 없음
    nickname: myProject.nickname,
    commentCount: 0,
    popularityScore: myProject.popularityScore,
    member: {
      id: currentUserId,
      nickname: myProject.nickname,
    },
    files: [],
    projectTechs: [],
  });

  // AllProjectResponse를 ProjectData로 변환 (기존 로직)
  const transformAllProjectToProjectData = (
    apiProject: AllProjectResponse,
    currentUserId: number
  ): ProjectData => ({
    id: apiProject.id,
    title: apiProject.title,
    content: apiProject.content || "프로젝트 상세 내용을 확인해보세요",
    thumbnailUrl: apiProject.thumbnailUrl || "", // null을 빈 문자열로 변환
    youtubeUrl: apiProject.youtubeUrl || "",
    viewCount: apiProject.viewCount,
    projectCategory: (apiProject.projectCategory as ProjectCategoryEnum) || "",
    createdAt: apiProject.createdAt || new Date().toISOString(),
    updatedAt: apiProject.updatedAt || new Date().toISOString(),
    isDeleted: false,
    githubUrl: apiProject.githubUrl || "",
    isPublic: apiProject.isPublic,
    likeCount: apiProject.likeCount,
    likedByMe: apiProject.likedByMe ?? false,
    nickname: apiProject.nickname,
    commentCount: 0,
    popularityScore: apiProject.popularityScore,
    member: {
      id: apiProject.authorId || currentUserId,
      nickname: apiProject.nickname,
    },
    files: [],
    projectTechs: [],
  });

  useEffect(() => {
    const fetchMyProjects = async () => {
      try {
        setLoading(true);
        setError(null);

        // 사용자 정보 확인
        const currentUserInfo = getUserInfoFromToken();
        if (!currentUserInfo || !currentUserInfo.id) {
          throw new Error("로그인이 필요합니다.");
        }

        setUserInfo(currentUserInfo);

        let transformedProjects: ProjectData[] = [];

        try {
          // 먼저 getMyProjects API 시도 (/members/projects)
          const myProjectsData: MyProjectResponse[] = await getMyProjects();

          // MyProjectResponse를 ProjectData로 변환
          transformedProjects = myProjectsData.map((project) =>
            transformMyProjectToProjectData(project, currentUserInfo.id)
          );
        } catch (myProjectsError) {

          try {
            // getMyProjects가 실패하면 getAllProjects로 대체하고 필터링
            const allProjects: AllProjectResponse[] = await getAllProjects();

            // 현재 사용자의 프로젝트만 필터링
            const myProjectsFiltered = allProjects.filter((project) => {
              // authorId가 있으면 그것으로 비교
              if (project.authorId) {
                return project.authorId === currentUserInfo.id;
              }
              // authorId가 없으면 nickname으로 비교
              return project.nickname === currentUserInfo.nickname;
            });


            // AllProjectResponse를 ProjectData로 변환
            transformedProjects = myProjectsFiltered.map((project) =>
              transformAllProjectToProjectData(project, currentUserInfo.id)
            );
          } catch (allProjectsError) {
            console.error("getAllProjects도 실패:", allProjectsError);
            throw new Error("프로젝트 데이터를 가져올 수 없습니다.");
          }
        }

        setMyProjects(transformedProjects);
      } catch (error) {
        console.error("❌ 프로젝트 로딩 실패:", error);

        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("프로젝트를 불러오는데 실패했습니다.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMyProjects();
  }, []);

  // 프로젝트 업데이트 핸들러
  const handleProjectUpdate = (updatedProject: ProjectData) => {
    setMyProjects((prevProjects) =>
      prevProjects.map((project) =>
        project.id === updatedProject.id ? updatedProject : project
      )
    );
  };

  // 새로고침 핸들러
  const handleRefresh = () => {
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#007DFC] mx-auto mb-4"></div>
          <p className="text-gray-600">내 프로젝트를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-md px-4 mx-auto text-center">
          <div className="mb-4 text-6xl text-red-500">⚠️</div>
          <h2 className="mb-2 text-2xl font-bold text-gray-900">
            오류가 발생했습니다
          </h2>
          <p className="mb-6 text-gray-600">{error}</p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={handleRefresh}
              className="bg-[#007DFC] hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              다시 시도
            </button>
            {error.includes("로그인") && (
              <Link to="/login">
                <button className="px-6 py-2 text-white transition-colors bg-gray-500 rounded-lg hover:bg-gray-600">
                  로그인하기
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  const publicProjectsCount = myProjects.filter((p) => p.isPublic).length;
  const privateProjectsCount = myProjects.length - publicProjectsCount;

  return (
    <div className="min-h-screen">
      <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* 헤더 섹션 */}
        <div className="p-8 mb-8 bg-white border border-gray-100 shadow-sm rounded-2xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 bg-gradient-to-b from-[#007DFC] to-blue-600 rounded-full"></div>
                <h1 className="text-3xl font-bold text-gray-900">
                  내 프로젝트
                </h1>
                {userInfo && (
                  <span className="px-3 py-1 text-sm text-gray-500 bg-gray-100 rounded-full">
                    {userInfo.nickname}
                  </span>
                )}
              </div>
              <p className="max-w-2xl text-lg leading-relaxed text-gray-600">
                당신의 프로젝트 지식을 다른 사람들과 공유하고{" "}
                <br className="hidden sm:block" />
                개발 커뮤니티에 기여해보세요
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-500">
                    총 {myProjects.length}개 프로젝트
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-500">
                    공개: {publicProjectsCount}개
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span className="text-sm text-gray-500">
                    비공개: {privateProjectsCount}개
                  </span>
                </div>
              </div>
            </div>

            {/* CTA 버튼 */}
            <div className="flex-shrink-0">
              <Link to="/projects/write">
                <button className="group relative bg-gradient-to-r from-[#007DFC] to-blue-600 hover:from-blue-600 hover:to-[#007DFC] text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-3">
                  <PlusSVG />새 프로젝트 등록
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* 프로젝트 목록 */}
        <div className="overflow-hidden bg-white border border-gray-100 shadow-sm rounded-2xl">
          {myProjects.length > 0 ? (
            <div className="p-6">
              <MypageProjectList
                mockProjects={myProjects}
                onProjectUpdate={handleProjectUpdate}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="flex items-center justify-center w-20 h-20 mb-6 bg-gray-100 rounded-full">
                <svg
                  className="w-10 h-10 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900">
                아직 프로젝트가 없습니다
              </h3>
              <p className="mb-6 text-center text-gray-500">
                첫 번째 프로젝트를 등록하고 다른 개발자들과 공유해보세요!
              </p>
              <Link to="/projects/write">
                <button className="group relative bg-gradient-to-r from-[#007DFC] to-blue-600 hover:from-blue-600 hover:to-[#007DFC] text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-3">
                  <PlusSVG />새 프로젝트 등록
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MypageProjectPage;
