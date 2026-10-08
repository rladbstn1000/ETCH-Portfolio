import { useEffect } from "react";
import { useLocation } from "react-router";
import TokenManager from "../utils/tokenManager";
import useUserStore from "../store/userStore";

export const useTokenRefresh = (isAppInitialized = true) => {
  const location = useLocation();
  const { isLoggedIn, logout } = useUserStore();

  // 페이지 이동 시 토큰 체크 및 갱신 (앱 초기화 후에만)
  useEffect(() => {
    const checkToken = async () => {
      if (!isAppInitialized || !isLoggedIn) return;

      const isValid = await TokenManager.checkAndRefreshToken();
      
      if (!isValid) {
        logout();
        window.location.href = "/login";
      }
    };

    checkToken();
  }, [location.pathname, isLoggedIn, logout, isAppInitialized]);

  // 페이지 로드 시 토큰 정보 초기화 (앱 초기화 후에만)
  useEffect(() => {
    if (isAppInitialized && isLoggedIn) {
      TokenManager.initializeTokenInfo();
    }
  }, [isLoggedIn, isAppInitialized]);

  // 브라우저 포커스 시 토큰 체크 (앱 초기화 후에만)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden && isAppInitialized && isLoggedIn) {
        const isValid = await TokenManager.checkAndRefreshToken();
        
        if (!isValid) {
          logout();
          window.location.href = "/login";
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isLoggedIn, logout, isAppInitialized]);
};