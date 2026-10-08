interface BaseListProps {
  id: number;
}
export interface FavoriteProjectProps extends BaseListProps {
  title: string; // projectName → title로 변경 (API 응답에 맞게)
  nickname: string; // writer → nickname으로 변경 (API 응답에 맞게)
  thumbnailUrl: string; // img → thumbnailUrl로 변경 (API 응답에 맞게)
  writerImg?: string; // 선택적 필드로 유지 (API에 없을 수 있음)
  viewCount: number; // 조회수 추가
  likeCount: number; // 좋아요 수 추가
  type?: "project";
  onCardClick?: (id: number) => void;
}

export interface FavoriteJobProps extends BaseListProps {
  companyName: string;
  title: string;
  location: string;
  createTime: string;
  expLevel: string;
}

export interface FavoriteCompanyProps extends BaseListProps {
  companyName: string;
  img: string;
}
