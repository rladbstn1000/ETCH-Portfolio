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
import ProjectCategory from "../../organisms/project/write/projectCategory";
import ProjectWriteInput from "../../organisms/project/write/projectWriteInput";
import ProjectStack from "../../organisms/project/write/projectStack";
import ProjectFileUpload from "../../organisms/project/write/projectFileUpload";
import StackSVG from "../../svg/stackSVG";
import { ProjectWriteTechData } from "../../../types/project/projectTechData";
import ProjectWriteText from "../../organisms/project/write/projectWriteText";

// 프로젝트 데이터 타입 정의 (부모 컴포넌트와 동일)
interface ProjectData {
  title: string;
  content: string;
  projectCategory: ProjectCategoryEnum | "";
  githubUrl: string;
  youtubeUrl: string;
  isPublic: boolean;
  projectTechs: number[];
  files: File[];
  thumbnailFile: File | null;
}

interface PortfolioProjectPageProps {
  projectData?: ProjectData;
  onProjectDataChange: (data: Partial<ProjectData>) => void;
}

function PortfolioProjectPage({
  projectData,
  onProjectDataChange,
}: PortfolioProjectPageProps) {
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(
    projectData?.thumbnailFile || null
  );

  // 썸네일 핸들러들
  const handleThumbnailUpload = (file: File) => {
    setThumbnailFile(file);
    onProjectDataChange({ thumbnailFile: file });
  };

  const handleThumbnailRemove = () => {
    setThumbnailFile(null);
    onProjectDataChange({ thumbnailFile: null });
  };

  const handleFileUpload = (newFiles: File[]) => {
    const updatedFiles = [...(projectData?.files || []), ...newFiles].slice(
      0,
      11
    );
    onProjectDataChange({ files: updatedFiles });
  };

  const handleFileRemove = (index: number) => {
    const updatedFiles = (projectData?.files || []).filter(
      (_, i) => i !== index
    );
    onProjectDataChange({ files: updatedFiles });
  };

  const handleTitleChange = (value: string) => {
    onProjectDataChange({ title: value });
  };

  const handleContentChange = (value: string) => {
    onProjectDataChange({ content: value });
  };

  const handleStacksChange = (techId: number) => {
    const currentIds = projectData?.projectTechs || [];
    const isSelected = currentIds.includes(techId);

    let newIds;
    if (isSelected) {
      newIds = currentIds.filter((id) => id !== techId);
    } else {
      newIds = [...currentIds, techId];
    }

    onProjectDataChange({ projectTechs: newIds });
  };

  const handleVideoUrlChange = (value: string) => {
    onProjectDataChange({ youtubeUrl: value });
  };

  const handleGithubUrlChange = (value: string) => {
    onProjectDataChange({ githubUrl: value });
  };

  const handleCategoryChange = (category: ProjectCategoryEnum) => {
    onProjectDataChange({ projectCategory: category });
  };

  const handleIsPublicChange = (isPublic: boolean) => {
    onProjectDataChange({ isPublic });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 파일 업로드 섹션 */}
      <section>
        <ProjectFileUpload
          uploadedFiles={projectData?.files || []}
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

      {/* 프로젝트 상세 정보 섹션 */}
      <section>
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <ProjectSVG />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                프로젝트 상세 정보
              </h3>
              <p className="text-sm text-gray-600">
                프로젝트의 기본 정보를 입력해주세요.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <ProjectWriteInput
              inputText="프로젝트 제목"
              placeholderText="프로젝트 제목을 입력해주세요"
              type="text"
              value={projectData?.title || ""}
              onChange={handleTitleChange}
            />
            <ProjectWriteText
              inputText="프로젝트 설명"
              value={projectData?.content || ""}
              onChange={handleContentChange}
            />
            <ProjectWriteInput
              inputText="시연 영상 URL"
              placeholderText="http://www.youtube.com/yourvideo"
              type="url"
              value={projectData?.youtubeUrl || ""}
              onChange={handleVideoUrlChange}
            />
            <ProjectWriteInput
              inputText="GitHub URL"
              placeholderText="http://github.com/username/repository"
              type="url"
              value={projectData?.githubUrl || ""}
              onChange={handleGithubUrlChange}
            />
          </div>
        </div>
      </section>

      {/* 기술 스택 섹션 */}
      <section>
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <StackSVG />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                기술 스택 선택
              </h3>
              <p className="text-sm text-gray-600">
                사용한 기술을 선택해주세요.
              </p>
            </div>
          </div>

          <ProjectStack
            isStackData={ProjectWriteTechData}
            isSelect={projectData?.projectTechs || []}
            onStackChange={handleStacksChange}
          />
        </div>
      </section>

      {/* 카테고리 섹션 */}
      <section>
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <CategorySVG />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                카테고리 선택
              </h3>
              <p className="text-sm text-gray-600">
                프로젝트 카테고리를 선택해주세요.
              </p>
            </div>
          </div>
          <ProjectCategory
            isCategoryData={ProjectWriteCategoryData}
            isSelect={projectData?.projectCategory || ""}
            onCategoryChange={handleCategoryChange}
          />
        </div>
      </section>

      {/* 공개 설정 섹션 */}
      <section>
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <IsPublicSVG />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">공개 설정</h3>
              <p className="text-sm text-gray-600">
                프로젝트 공개 범위를 설정해주세요.
              </p>
            </div>
          </div>
          <ProjectIsPublic
            isPublicData={ProjectIsPublicData}
            isPublic={projectData?.isPublic ?? true}
            onIsPublicChange={handleIsPublicChange}
          />
        </div>
      </section>
    </div>
  );
}

export default PortfolioProjectPage;
