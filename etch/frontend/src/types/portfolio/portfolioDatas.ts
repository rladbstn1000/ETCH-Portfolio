import type { PortfolioStackEnum } from "./portfolioStack";

export interface portfolioDatas {
  name: string;
  phoneNumber: string;
  email: string;
  blogUrl: string;
  githubUrl: string;
  introduce: string;
  stack: PortfolioStackEnum[];

  // 문자열로 받아서 파싱하여 사용
  language: string; // "토익^ETS^2025-08-11/토플^ETS^2025-08-12" 형태
  education: string; // "삼성전자^인턴십^2025-01-01^2025-02-28/네이버^부트캠프^2025-03-01^2025-04-30" 형태

  // projects는 별도 ProjectData로 관리하므로 제거하거나 사용하지 않음
  // projects: PortfolioProject[]; // 이 부분 제거
}

// 초기 상태값
export const PortfolioState: portfolioDatas = {
  name: "",
  phoneNumber: "",
  blogUrl: "",
  email: "",
  githubUrl: "",
  introduce: "",
  stack: [],

  // 문자열로 초기화
  education: "",
  language: "",
};

// 파싱을 위한 개별 타입들 (실제 사용은 배열로)
export interface education {
  companyName: string;
  startAt: string;
  endAt: string;
  active: string;
}

export const ActivityState: education = {
  companyName: "",
  startAt: "",
  endAt: "",
  active: "",
};

export interface language {
  licenseName: string;
  getAt: string;
  issuer: string;
}

export const LicenseState: language = {
  licenseName: "",
  getAt: "",
  issuer: "",
};

// PortfolioProject 관련 코드는 제거 (사용하지 않음)
// export interface PortfolioProject { ... }
// export const PortfolioProjectState: PortfolioProject = { ... };
