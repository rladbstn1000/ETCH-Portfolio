import { useState } from "react";
import { ProjectIsPublicData } from "../../../types/project/proejctIsPublicData";
import {
  ProjectWriteCategoryData,
  type ProjectCategoryEnum,
} from "../../../types/project/projectCategroyData";
import ProjectIsPublic from "../../organisms/project/write/projectIsPublic";
import CategorySVG from "../../svg/categorySVG";
import IsPublicSVG from "../../svg/isPublicSVG";
import ProjectSVG from "../../svg/projectSVG";
import {
  type ProjectInputData, // 🔥 ProjectInputData만 사용
} from "../../../types/project/projectDatas";
import ProjectCategory from "../../organisms/project/write/projectCategory";
import ProjectWriteInput from "../../organisms/project/write/projectWriteInput";
import ProjectStack from "../../organisms/project/write/projectStack";
import ProjectWriteSubmitButton from "../../organisms/project/write/projectWriteSubmitButton";
import ProjectFileUpload from "../../organisms/project/write/projectFileUpload";
import StackSVG from "../../svg/stackSVG";
import { createProject } from "../../../api/projectApi";
import { useNavigate } from "react-router";
import { ProjectWriteTechData } from "../../../types/project/projectTechData";
import ProjectWriteText from "../../organisms/project/write/projectWriteText";

// 🔥 프로젝트 작성용 별도 상태 인터페이스 정의
interface ProjectWriteState {
  title: string;
  content: string;
  projectCategory: ProjectCategoryEnum | "";
  githubUrl: string;
  youtubeUrl: string;
  isPublic: boolean;
  projectTechs: number[]; // 선택된 기술 스택 ID들
  files: File[]; // 업로드된 파일들
}

// 🔥 초기 상태값
const initialProjectWriteState: ProjectWriteState = {
  title: "",
  content: "",
  projectCategory: "",
  githubUrl: "",
  youtubeUrl: "",
  isPublic: true,
  projectTechs: [],
  files: [],
};

function ProjectWritePage() {
  const navigate = useNavigate();

  // 🔥 ProjectWriteState 사용 (ProjectData 대신)
  const [projectData, setProjectData] = useState<ProjectWriteState>({
    ...initialProjectWriteState,
  });

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  // 2. 썸네일 핸들러들
  const handleThumbnailUpload = (file: File) => {
    setThumbnailFile(file);
  };

  const handleThumbnailRemove = () => {
    setThumbnailFile(null);
  };

  const handleFileUpload = (newFiles: File[]) => {
    setProjectData((prev) => ({
      ...prev,
      files: [...prev.files, ...newFiles].slice(0, 11),
    }));
  };

  const handleFileRemove = (index: number) => {
    setProjectData((prev) => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
    }));
  };

  const handleTitleChange = (value: string) => {
    setProjectData((prev) => ({
      ...prev,
      title: value,
    }));
  };

  const handleContentChange = (value: string) => {
    setProjectData((prev) => ({
      ...prev,
      content: value,
    }));
  };

  // ID 기반으로 수정된 기술 스택 핸들러
  const handleStacksChange = (techId: number) => {
    setProjectData((prev) => {
      const currentIds = prev.projectTechs;
      const isSelected = currentIds.includes(techId);

      let newIds;
      if (isSelected) {
        newIds = currentIds.filter((id) => id !== techId);
      } else {
        newIds = [...currentIds, techId];
      }

      return {
        ...prev,
        projectTechs: newIds,
      };
    });
  };

  // 파일 분류 함수
  const categorizeFiles = (files: File[]) => {
    let thumbnailFile: File | undefined;
    const imageFiles: File[] = [];

    files.forEach((file, index) => {
      if (file.type.startsWith("image/")) {
        if (index === 0) {
          thumbnailFile = file;
        } else {
          imageFiles.push(file);
        }
      }
    });

    return { thumbnailFile, imageFiles };
  };

  const handleSubmit = async () => {
    try {
      // 유효성 검사
      if (!projectData.title.trim()) {
        alert("프로젝트 제목을 입력해주세요.");
        return;
      }

      if (!projectData.content.trim()) {
        alert("프로젝트 설명을 입력해주세요.");
        return;
      }

      if (!projectData.projectCategory) {
        alert("프로젝트 카테고리를 선택해주세요.");
        return;
      }

      // 썸네일이 없으면 기본 이미지 사용 여부 확인
      if (!thumbnailFile) {
        const useDefault = confirm(
          "썸네일 이미지가 없습니다. 기본 이미지를 사용하시겠습니까?"
        );
        if (!useDefault) {
          alert("썸네일 이미지를 업로드해주세요.");
          return;
        }
      }

      // 파일 분류
      const { imageFiles } = categorizeFiles(projectData.files);

      // 🔥 ProjectInputData 형태로 API 호출 (정확한 필드명 사용)
      const projectInput: ProjectInputData = {
        title: projectData.title,
        content: projectData.content,
        projectCategory: projectData.projectCategory as ProjectCategoryEnum,
        techCodeIds: projectData.projectTechs, // 🔥 API에서 요구하는 필드명
        githubUrl: projectData.githubUrl || "",
        youtubeUrl: projectData.youtubeUrl || "",
        isPublic: projectData.isPublic,
        thumbnailFile: thumbnailFile || undefined,
        imageFiles,
      };

      // API 호출
      await createProject(projectInput);

      alert("프로젝트가 성공적으로 등록되었습니다!");

      // 성공 후 /projects 페이지로 이동
      navigate("/projects");
    } catch (error) {
      console.error("프로젝트 생성 실패:", error);
      alert("프로젝트 등록 중 오류가 발생했습니다.");
    }
  };

  const handleVideoUrlChange = (value: string) => {
    setProjectData((prev) => ({
      ...prev,
      youtubeUrl: value,
    }));
  };

  const handleGithubUrlChange = (value: string) => {
    setProjectData((prev) => ({
      ...prev,
      githubUrl: value,
    }));
  };

  const handleCategoryChange = (category: ProjectCategoryEnum) => {
    setProjectData((prev) => ({
      ...prev,
      projectCategory: category,
    }));
  };

  const handleIsPublicChange = (isPublic: boolean) => {
    setProjectData((prev) => ({
      ...prev,
      isPublic: isPublic,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* 메인 헤더 섹션 */}
        <section className="mb-6 sm:mb-8 lg:mb-12">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              새 프로젝트 만들기
            </h1>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed px-4">
              당신의 창의적인 작품을 전 세계와 공유하세요. 프로젝트의 모든
              세부사항을 입력하고 최고의 작품을 업로드하세요.
            </p>
          </div>
        </section>

        {/* 메인 콘텐츠 */}
        <div className="space-y-4 sm:space-y-6 lg:space-y-8">
          <section>
            <ProjectFileUpload
              uploadedFiles={projectData.files}
              onFileUpload={handleFileUpload}
              onFileRemove={handleFileRemove}
              thumbnailFile={thumbnailFile}
              onThumbnailUpload={handleThumbnailUpload}
              onThumbnailRemove={handleThumbnailRemove}
              maxFiles={10}
              maxFileSize={5 * 1024 * 1024}
              acceptedTypes={["image/png", "image/jpeg"]}
            />
          </section>

          <section>
            <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-6">
                <ProjectSVG />
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                    프로젝트 상세 정보
                  </h2>
                  <p className="text-sm text-gray-600">
                    프로젝트의 기본 정보를 입력해주세요.
                  </p>
                </div>
              </div>

              <div className="space-y-4 sm:space-y-6">
                <ProjectWriteInput
                  inputText="프로젝트 제목"
                  placeholderText="프로젝트 제목을 입력해주세요"
                  type="text"
                  value={projectData.title}
                  onChange={handleTitleChange}
                />
                <ProjectWriteText
                  inputText="프로젝트 설명"
                  value={projectData.content}
                  onChange={handleContentChange}
                />
                <ProjectWriteInput
                  inputText="시연 영상 URL"
                  placeholderText="http://www.youtube.com/yourvideo"
                  type="url"
                  value={projectData.youtubeUrl}
                  onChange={handleVideoUrlChange}
                />
                <ProjectWriteInput
                  inputText="GitHub URL"
                  placeholderText="http://github.com/username/repository"
                  type="url"
                  value={projectData.githubUrl}
                  onChange={handleGithubUrlChange}
                />
              </div>
            </div>
          </section>

          <section>
            <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-6">
                <StackSVG />
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                    기술 스택 선택
                  </h2>
                  <p className="text-sm text-gray-600">
                    사용한 기술을 선택해주세요.
                  </p>
                </div>
              </div>

              <ProjectStack
                isStackData={ProjectWriteTechData}
                isSelect={projectData.projectTechs}
                onStackChange={handleStacksChange}
              />
            </div>
          </section>

          <section>
            <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-6">
                <CategorySVG />
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                    카테고리 선택
                  </h2>
                  <p className="text-sm text-gray-600">
                    프로젝트 카테고리를 선택해주세요.
                  </p>
                </div>
              </div>
              <ProjectCategory
                isCategoryData={ProjectWriteCategoryData}
                isSelect={projectData.projectCategory}
                onCategoryChange={handleCategoryChange}
              />
            </div>
          </section>

          <section>
            <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-6">
                <IsPublicSVG />
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                    공개 설정
                  </h2>
                  <p className="text-sm text-gray-600">
                    프로젝트 공개 범위를 설정해주세요.
                  </p>
                </div>
              </div>
              <ProjectIsPublic
                isPublicData={ProjectIsPublicData}
                isPublic={projectData.isPublic}
                onIsPublicChange={handleIsPublicChange}
              />
            </div>
          </section>
        </div>

        <section className="mt-6 sm:mt-8 lg:mt-12">
          <div className="flex justify-center">
            <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-10">
              <ProjectWriteSubmitButton
                onSubmit={handleSubmit}
                isDisabled={!projectData.title || !projectData.content}
              />
            </div>

            <div className="hidden sm:block w-full max-w-md">
              <ProjectWriteSubmitButton
                onSubmit={handleSubmit}
                isDisabled={!projectData.title || !projectData.content}
              />
            </div>
          </div>
        </section>

        <div className="h-20 sm:hidden"></div>
      </div>
    </div>
  );
}

export default ProjectWritePage;
