import TokenManager from "./tokenManager";

// 개발자 도구에서 토큰 상태 확인용 함수들
export const tokenDebug = {
  // 토큰 정보 출력
  showTokenInfo: () => {
    TokenManager.getToken();
    TokenManager.getTokenInfo();
  },

  // 강제로 토큰 갱신
  forceRefresh: async () => {
    await TokenManager.refreshToken();
    tokenDebug.showTokenInfo();
  },

  // 토큰 상태 체크
  checkToken: async () => {
    await TokenManager.checkAndRefreshToken();
    tokenDebug.showTokenInfo();
  },

  // 토큰 제거 (테스트용)
  clearToken: () => {
    TokenManager.removeToken();
    tokenDebug.showTokenInfo();
  },

  // 만료된 토큰으로 시뮬레이션 (테스트용)
  simulateExpiredToken: () => {
    const token = TokenManager.getToken();
    if (token) {
      // 1분 전 발급된 토큰으로 시뮬레이션 (30분 만료이므로 만료됨)
      TokenManager.setToken(token, -1); // -1분 = 이미 만료됨
      tokenDebug.showTokenInfo();
    }
  },
};

// 개발 환경에서만 global 객체에 추가
if (typeof window !== "undefined" && import.meta.env.DEV) {
  (window as any).tokenDebug = tokenDebug;
}