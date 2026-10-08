export type LikeType = 'NEWS' | 'COMPANY' | 'JOB' | 'PROJECT';

export interface LikeRequest {
  targetId: number;
}

export interface NewsLike {
  id: number;
  thumbnailUrl: string;
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  name: string;
}

export interface CompanyLike {
  id: number;
  name: string;
  industry: string;
}

export interface JobLike {
  id: number;
  title: string;
  companyName: string;
  regions: string[];
  jobCategories: string[];
  openingDate: string;
  expirationDate: string;
}

export interface ProjectLike {
  id: number;
  title: string;
  thumbnailUrl: string;
  viewCount: number;
  isDeleted: boolean;
  nickname: string;
}