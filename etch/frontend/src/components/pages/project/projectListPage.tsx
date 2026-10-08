import { Link } from "react-router";
import { useState, useEffect, useCallback, useMemo } from "react";
import ProjectListCard from "../../organisms/project/list/projectListCard";
import { ProjectSidebarType } from "../../../types/projectSidebarType";
import ProjectListSidebar from "../../organisms/project/list/projectListSidebar";
import ProjectListSearch from "../../organisms/project/list/projectListSearch";
import Pagination from "../../common/pagination";
import type { ProjectData } from "../../../types/project/projectDatas";
import { getAllProjects } from "../../../api/projectApi";
import { getCategoryFromNumber } from "../../../types/project/projectCategroyData";

// ✅ TypeScript를 위한 window 객체 확장
declare global {
  interface Window {
    debugData?: {
      projects: ProjectData[];
      selectedSort: string;
      searchTerm: string;
      selectedCategory: string;
    };
  }
}

function ProjectListPage() {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 필터 상태 관리 - 기본값을 명시적으로 최신순으로 설정
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedSort, setSelectedSort] = useState<string>("LATEST"); // 기본값: 최신순

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);

  const fetchProjects = async (): Promise<ProjectData[]> => {
    try {
      const data = await getAllProjects(); // 정렬 파라미터 제거
      return data;
    } catch (error) {
      console.error("❌ 프로젝트 데이터 fetch 에러:", error);
      throw error;
    }
  };

  // 컴포넌트 마운트 시 프로젝트 데이터 로드
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        const projectData = await fetchProjects();

        // ID 기준으로 최신순 정렬 (높은 ID = 최신)
        const sortedData = [...projectData].sort((a, b) => {
          return (b.id || 0) - (a.id || 0);
        });

        setProjects(sortedData);
      } catch (err) {
        setError("프로젝트 데이터를 불러오는데 실패했습니다.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  // ✅ 디버깅 데이터 설정
  useEffect(() => {
    // 전역 디버깅 데이터 설정
    window.debugData = {
      projects,
      selectedSort,
      searchTerm,
      selectedCategory,
    };
  }, [projects, selectedSort, selectedCategory, searchTerm]);

  useEffect(() => {
    if (projects.length > 0) {
      // 각 프로젝트의 인기도 관련 필드 확인
    }
  }, [projects]);

  const handleProjectUpdate = (updatedProject: ProjectData) => {
    // ✅ popularityScore가 없으면 전체 데이터 새로고침
    if (updatedProject.popularityScore === undefined) {
      const refreshAllData = async () => {
        try {
          const freshData = await getAllProjects();
          const sortedData = [...freshData].sort(
            (a, b) => (b.id || 0) - (a.id || 0)
          );
          setProjects(sortedData);
        } catch (error) {
          console.error("전체 데이터 새로고침 실패:", error);
        }
      };
      refreshAllData();
      return;
    }

    // popularityScore가 있으면 기존 로직 실행
    setProjects((prevProjects) =>
      prevProjects.map((project) =>
        project.id === updatedProject.id ? updatedProject : project
      )
    );
  };

  // ✅ useMemo로 필터링된 프로젝트 계산 - 디버깅 로그 추가
  const filteredProjects = useMemo(() => {
    let filtered = [...projects];

    // 0. 공개된 프로젝트만 필터링
    filtered = filtered.filter((project) => project.isPublic);

    // 1. 검색어 필터링
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (project) =>
          (project.title || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (project.content || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    // 2. 카테고리 필터링
    if (selectedCategory && selectedCategory !== "ALL") {
      filtered = filtered.filter((project) => {
        if (
          typeof project.projectCategory === "string" &&
          project.projectCategory !== ""
        ) {
          return project.projectCategory === selectedCategory;
        }
        if (typeof project.projectCategory === "number") {
          const projectCategoryEnum = getCategoryFromNumber(
            project.projectCategory
          );
          return projectCategoryEnum === selectedCategory;
        }
        return false;
      });
    }

    // 3. ✅ 클라이언트 사이드 정렬 (디버깅 로그 추가)

    filtered.sort((a, b) => {
      switch (selectedSort) {
        case "LATEST": {
          const result = (b.id || 0) - (a.id || 0);
          return result;
        }

        case "POPULAR": {
          const popularityA = Number(a.popularityScore || 0);
          const popularityB = Number(b.popularityScore || 0);
          const result = popularityB - popularityA;

          return result !== 0 ? result : (b.id || 0) - (a.id || 0);
        }

        case "VIEWS": {
          const viewsA = Number(a.viewCount || 0);
          const viewsB = Number(b.viewCount || 0);
          const result = viewsB - viewsA;
          return result !== 0 ? result : (b.id || 0) - (a.id || 0);
        }

        case "LIKES": {
          const likesA = Number(a.likeCount || 0);
          const likesB = Number(b.likeCount || 0);
          const result = likesB - likesA;
          return result !== 0 ? result : (b.id || 0) - (a.id || 0);
        }

        default: {
          return (b.id || 0) - (a.id || 0);
        }
      }
    });

    return filtered;
  }, [projects, searchTerm, selectedCategory, selectedSort]);

  // 페이지네이션 계산
  const totalElements = filteredProjects.length;
  const totalPages = Math.ceil(totalElements / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProjects = filteredProjects.slice(startIndex, endIndex);
  const isLast = currentPage === totalPages;

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 필터/검색 시 첫 페이지로 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedSort]);

  // 검색 핸들러
  const handleSearch = useCallback((searchTermValue: string) => {
    setSearchTerm(searchTermValue);
  }, []);

  // 카테고리 필터 핸들러
  const handleCategoryFilter = useCallback((category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  }, []);

  // ✅ 정렬 핸들러 - 디버깅 로그 추가
  const handleSortChange = useCallback((sortType: string) => {
    setSelectedSort(sortType);
    setCurrentPage(1);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#007DFC]"></div>
          <p className="text-gray-600">프로젝트 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-4 text-center">
          <div className="text-6xl text-red-500">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900">
            오류가 발생했습니다
          </h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#007DFC] hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* 전체 컨테이너 */}
      <div className="px-4 py-6 mx-auto max-w-7xl">
        <div className="flex gap-8">
          {/* 사이드바 영역 */}
          <div className="flex-shrink-0 hidden w-64 lg:block">
            <ProjectListSidebar
              ProjectSidebarType={ProjectSidebarType}
              onCategoryFilter={handleCategoryFilter}
              onSortChange={handleSortChange}
            />
          </div>

          {/* 메인 콘텐츠 영역 */}
          <div className="flex-1 space-y-6">
            {/* 헤더 섹션 */}
            <section className="space-y-4 text-center">
              <h1 className="text-3xl font-bold text-gray-900">
                개발자 프로젝트
              </h1>
              <p className="max-w-2xl mx-auto text-gray-600">
                웹 개발, 모바일 앱, AI/ML, 블록체인등 다양한 IT프로젝트를
                확인하세요. 실력있는 개발자들의 최신 프로젝트와 기술 스택을
                탐색할 수 있습니다.
              </p>
              <div className="flex items-center justify-center space-x-4">
                <Link to={"/projects/write"}>
                  <button className="bg-[#007DFC] hover:bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold transition-colors shadow-lg">
                    새 프로젝트 등록
                  </button>
                </Link>
              </div>
            </section>
            {/* 검색 섹션 */}
            <section>
              <ProjectListSearch onSearch={handleSearch} />
            </section>

            {/* 프로젝트 카드 섹션 */}
            <section>
              {currentProjects.length > 0 ? (
                <ProjectListCard
                  projects={currentProjects}
                  onProjectUpdate={handleProjectUpdate}
                />
              ) : (
                <div className="py-12 text-center">
                  <div className="mb-4 text-6xl text-gray-400">📂</div>
                  <h3 className="mb-2 text-xl font-semibold text-gray-900">
                    프로젝트가 없습니다
                  </h3>
                  <p className="mb-4 text-gray-600">
                    {searchTerm || selectedCategory !== "ALL"
                      ? "검색 조건에 맞는 프로젝트가 없습니다. 검색 조건을 변경해보세요."
                      : "등록된 프로젝트가 없습니다. 새로운 프로젝트를 등록해보세요."}
                  </p>
                </div>
              )}
            </section>
            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalElements={totalElements}
                isLast={isLast}
                onPageChange={handlePageChange}
                itemsPerPage={itemsPerPage}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectListPage;
