// Job 관련 타입 정의

export interface Job {
  id: number;
  title: string; // 채용공고 제목
  companyName: string;
  companyId: number;
  regions: string[];
  industries: string[];
  jobCategories: string[];
  workType: string;
  educationLevel: string;
  openingDate: string; // ISO date string
  expirationDate: string; // ISO date string
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

// API 요청/응답 타입
export interface JobListParams {
  start: string; // YYYY-MM-DD 형식
  end: string; // YYYY-MM-DD 형식
}
