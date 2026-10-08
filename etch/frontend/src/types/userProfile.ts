// 백엔드의 DTO와 유사하게 타입을 정의합니다.
export interface UserProfile {
  id: number;
  email: string;
  nickname: string;
  profile?: string;
}
