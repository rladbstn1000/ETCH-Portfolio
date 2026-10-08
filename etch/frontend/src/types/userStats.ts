// 사용자 통계 데이터 인터페이스
export interface UserStats {
  applicationCount: number;      // 진행중인 지원
  favoriteCompanyCount: number;  // 관심 기업  
  projectCount: number;          // 등록한 프로젝트
}