import { PUBLIC_DEMO } from "../config/publicDemo";
import axios from "axios";
import { BASE_API } from "./BASE_API";
import TokenManager from "../utils/tokenManager";

// 인증이 필요 없는 경우를 위한 기본 인스턴스
export const defaultInstance = axios.create({
  baseURL: BASE_API,
  withCredentials: !PUBLIC_DEMO,
  timeout: PUBLIC_DEMO ? 12000 : 0,
  headers: {
    "Content-Type": "application/json",
  },
});

// 인증이 필요한 경우를 위한 인스턴스
export const authInstance = axios.create({
  baseURL: BASE_API,
  withCredentials: !PUBLIC_DEMO,
  timeout: PUBLIC_DEMO ? 12000 : 0,
  headers: {
    "Content-Type": "application/json",
  },
});

// authInstance에만 요청 인터셉터를 추가합니다.
authInstance.interceptors.request.use(
  (config) => {
    const accessToken = PUBLIC_DEMO ? null : TokenManager.getToken();

    // 요청 헤더에 토큰 추가
    if (accessToken) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }

    // FormData인 경우 Content-Type을 삭제하여 브라우저가 자동으로 설정하도록 함
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// authInstance에 응답 인터셉터를 추가합니다.
authInstance.interceptors.response.use(
  // 1. 성공적인 응답은 그대로 반환
  (response) => {
    return response;
  },
  // 2. 에러가 발생한 응답을 처리
  async (error) => {
    const originalRequest = error.config;

    // 401 에러이고, 재시도한 요청이 아닐 경우에만 토큰 갱신 시도
    if (!PUBLIC_DEMO && error.response?.status === 401 && !originalRequest._retry) {
      // 로그인 상태가 아닌 경우 (access_token이 없는 경우) 바로 로그인 요구
      const accessToken = PUBLIC_DEMO ? null : TokenManager.getToken();
      if (!accessToken) {
        // /members/me 호출이 아닌 경우에만 alert 표시
        if (!originalRequest.url?.includes('/members/me')) {
          alert("로그인이 필요한 기능입니다. 로그인 후 이용해주세요.");
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }

      originalRequest._retry = true; // 재시도 플래그 설정 (무한 루프 방지)
      
      // TokenManager를 사용하여 토큰 갱신
      const refreshSuccess = await TokenManager.refreshToken();
      
      if (refreshSuccess) {
        // 갱신 성공 시 원래 요청 재시도
        const newAccessToken = TokenManager.getToken();
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        return authInstance(originalRequest);
      } else {
        // 갱신 실패 시 이미 TokenManager에서 로그아웃 처리됨
        window.location.href = "/login";
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);
