// 지원 상태 업데이트 요청 (PUT /appliedJobs/{appliedJobId} 요청 Body)
export interface AppliedJobUpdateRequest {
  status: string; // 백엔드에서 받은 상태 코드를 그대로 사용
}

// 지원 공고 목록 응답 (GET /appliedJobs/list 응답)
export interface AppliedJobListResponse {
  appliedJobId: number; // 지원 ID
  jobId: number; // 공고 ID
  companyId: number; // 회사 ID
  title: string; // 공고 제목
  companyName: string; // 회사명
  openingDate: string; // LocalDateTime -> ISO string
  closingDate: string; // expirationDate -> ISO string
  status: string; // ApplyStatusType.name() -> string
}

// API 파라미터 타입들
export interface ApplyJobParams {
  jobId: number;
}

export interface UpdateAppliedJobParams {
  appliedJobId: number;
}

export interface DeleteAppliedJobParams {
  appliedJobId: number;
}

// 지원 상태별 한국어 라벨은 이제 getApplyStatusCodes API로 동적으로 받아서 사용
