import type { ProjectCategoryEnum } from "./projectCategroyData";

// GET /api/projects/{id} 응답 데이터
export interface BackendProjectResponse {
  id: number;
  title: string;
  content: string;
  thumbnailUrl?: string;
  youtubeUrl?: string;
  githubUrl?: string;
  projectCategory: ProjectCategoryEnum;
  isPublic: boolean;
  viewCount: number;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  likedByMe: boolean;

  // 멤버 정보
  member: {
    id: number;
    nickname?: string;
  };

  // 기술 스택 (전체 객체) - 배열이므로 [] 사용
  projectTechs: {
    id: number;
    techCode: {
      id: number;
      techCategory: string;
      codeName: string;
    };
  }[];

  // 파일들 (이미지 + PDF) - 배열이므로 [] 사용
  files?: {
    id: number;
    fileName: string;
    fileUrl: string;
    isPdf?: boolean;
  }[];
}

// PUT /api/projects/{id} 실제 FormData 구조
export interface ProjectUpdateFormData {
  // FormData로 전송되는 구조
  data: Blob; // JSON을 Blob으로 변환한 것
  thumbnail?: File;
  images?: File[];
  pdf?: File;
}

// JSON 데이터 부분 (FormData의 data에 들어가는 내용)
export interface ProjectUpdateDataPart {
  title: string;
  content: string;
  category: ProjectCategoryEnum;
  techCodeIds: number[]; // ID 배열만
  githubUrl?: string;
  youtubeUrl?: string;
  isPublic: boolean;

  // 삭제 관련
  removeThumbnail?: boolean;
  removeFileIds?: number[];
  removePdf?: boolean;
}

// 프론트엔드에서 사용할 통합 타입
export interface ProjectUpdateRequest {
  title: string;
  content: string;
  projectCategory: ProjectCategoryEnum;
  techCodeIds: number[];
  githubUrl?: string;
  youtubeUrl?: string;
  isPublic: boolean;

  // 파일들
  thumbnailFile?: File;
  imageFiles?: File[];
  pdfFile?: File;

  // 삭제 관련
  removeThumbnail?: boolean;
  removeFileIds?: number[];
  removePdf?: boolean;
}
