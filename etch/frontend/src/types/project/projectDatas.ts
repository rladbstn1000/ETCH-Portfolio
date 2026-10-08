// 1. projectDatas.ts 파일 수정

import type { ProjectCategoryEnum } from "./projectCategroyData";

// 백엔드 응답용 타입들 (API 응답 받을 때만 사용)
export interface TechCodeData {
  id: number;
  techCategory: string;
  codeName: string;
}

export interface ProjectTechData {
  id: number;
  techCode: TechCodeData;
}

export interface MemberData {
  id: number;
  nickname?: string;
  email?: string;
}

export interface ProjectModalData extends ProjectData {
  type: "project"; // CardType 추가
  onCardClick?: (id: number) => void;
}

// 🔥 수정된 ProjectData - API 응답 구조에 맞게 변경
export interface ProjectData {
  id: number;
  title: string;
  content: string;
  thumbnailUrl: string;
  youtubeUrl: string;
  viewCount: number;
  projectCategory: ProjectCategoryEnum | "";
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  githubUrl: string;
  isPublic: boolean;
  likeCount: number;
  commentCount?: number;
  popularityScore?: number;
  nickname: string;
  likedByMe: boolean;

  // 🔥 작성자 정보 - API 응답에 맞게 수정
  memberId?: number; // API에서 오는 실제 필드
  profileUrl?: string; // 프로필 이미지 URL

  member: {
    id: number;
    nickname: string;
  };

  // 🔥 기술 스택 - API 응답에 맞게 수정
  techCodes?: string[]; // API에서 오는 실제 필드 (문자열 배열)
  techCategories?: string[]; // API에서 오는 카테고리들
  projectTechs?: number[]; // 기존 방식 (하위 호환성)

  // 파일 관련
  files?: File[]; // 기존 방식 유지
  fileUrls?: string[]; // API에서 오는 파일 URL들
}

// 백엔드 API 호출용 입력 데이터 타입 (중복 제거)
export interface ProjectInputData {
  title: string;
  content: string;
  projectCategory: ProjectCategoryEnum;
  githubUrl?: string;
  youtubeUrl?: string;
  isPublic: boolean;
  techCodeIds: number[]; // 백엔드로 보낼 때는 ID 배열

  // 파일 관련
  thumbnailFile?: File;
  imageFiles?: File[];
  pdfFile?: File;

  // 수정시에만 사용
  removeThumbnail?: boolean;
  removeFileIds?: number[];
  removePdf?: boolean;
}

// 🔥 수정된 초기 상태값
export const ProjectState: ProjectData = {
  id: 0,
  title: "",
  content: "",
  thumbnailUrl: "",
  youtubeUrl: "",
  viewCount: 0,
  likeCount: 0,
  commentCount: 0,
  popularityScore: 0,
  projectCategory: "",
  createdAt: "",
  updatedAt: "",
  isDeleted: false,
  likedByMe: false,
  githubUrl: "",
  isPublic: true,
  nickname: "",
  memberId: 0,
  profileUrl: "",
  member: {
    id: 1,
    nickname: "",
  },
  files: [],
  fileUrls: [],
  techCodes: [], // 🔥 새로 추가
  techCategories: [], // 🔥 새로 추가
  projectTechs: [], // 기존 유지
};

// 프로젝트 입력 초기 상태
export const ProjectInputState: ProjectInputData = {
  title: "",
  content: "",
  projectCategory: "" as ProjectCategoryEnum,
  githubUrl: "",
  youtubeUrl: "",
  isPublic: true,
  techCodeIds: [],
  removeThumbnail: false,
  removeFileIds: [],
  removePdf: false,
};
