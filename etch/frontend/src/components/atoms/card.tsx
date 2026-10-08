import type { CommentProps } from "./comment";
import type { ProjectCategoryEnum } from "../../types/project/projectCategroyData";

type CardType = "job" | "project" | "news" | "company" | "stats" | "question";

interface BaseCardProps {
  type: CardType;
}

export interface JobCardProps extends BaseCardProps {
  id: number;
  createTime: Date;
  title: string;
}

// ProjectData와 완전히 일치하는 ProjectCardProps
export interface ProjectCardProps extends BaseCardProps {
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
  nickname: string;
  authorId?: number;
  onClose?: () => void;
  likedByMe?: boolean;
  onLike?: () => void;

  // 🔥 member 타입 수정 - nickname 옵션 추가
  member: {
    id: number;
    nickname?: string; // 🔥 추가
  };

  files: File[];
  projectTechs: number[];

  // 추가 필드들
  likeCount: number;
  writerImg?: string;
  commentCount?: number;
  comments?: CommentProps[];
  onCardClick?: (id: number) => void;

  // 🔥 새로운 API 필드들 추가
  techCodes?: string[]; // API에서 오는 기술 스택
  techCategories?: string[]; // API에서 오는 기술 카테고리
  fileUrls?: string[]; // API에서 오는 파일 URL들
  profileUrl?: string; // API에서 오는 프로필 이미지
  memberId?: number; // API에서 오는 작성자 ID
}

export interface NewsCardProps extends BaseCardProps {
  id: number;
  thumbnailUrl?: string; // ✅ optional로 변경
  title: string;
  description?: string; // ✅ optional로 변경 (News 타입과 일치)
  url: string;
  publishedAt: string;
  companyName?: string; // 회사명 추가
  onLikeClick?: (newsId: number) => void; // 좋아요 클릭 핸들러
}

export interface CompanyCardProps extends BaseCardProps {
  like: number;
  companyName: string;
  img?: string;
  rank?: number;
}

export interface StatsCardData extends BaseCardProps {
  title: string;
  type: "stats";
  value: number;
  icon: string;
  color: string;
}

export interface QuestionCardProps extends BaseCardProps {
  questionNumber: number;
  questionTitle: string;
  structure: string;
  tips: string;
  keywords: string;
  answer: string;
  onAnswerChange: (answer: string) => void;
}
