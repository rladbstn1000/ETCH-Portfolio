import { jwtDecode } from "jwt-decode";
import { defaultInstance } from "../api/instances";
import useUserStore from "../store/userStore";

interface TokenInfo {
  token: string;
  issuedAt: number; // 토큰 발급 시간 (timestamp)
  expiresIn: number; // 만료 시간 (분 단위, 기본 30분)
}

class TokenManager {
  private static readonly TOKEN_KEY = "access_token";
  private static readonly TOKEN_INFO_KEY = "token_info";
  private static readonly DEFAULT_EXPIRES_IN = 30; // 30분
  private static readonly REFRESH_THRESHOLD = 5; // 5분 전에 갱신

  // 토큰 저장 (발급 시간 포함)
  static setToken(token: string, expiresIn: number = this.DEFAULT_EXPIRES_IN): void {
    token = token.replace(/^Bearer\s+/i, "").trim();
    const tokenInfo: TokenInfo = {
      token,
      issuedAt: Date.now(),
      expiresIn: expiresIn * 60 * 1000, // 분을 밀리초로 변환
    };

    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.TOKEN_INFO_KEY, JSON.stringify(tokenInfo));
  }

  // 토큰 정보 가져오기
  static getTokenInfo(): TokenInfo | null {
    try {
      const tokenInfoStr = localStorage.getItem(this.TOKEN_INFO_KEY);
      return tokenInfoStr ? JSON.parse(tokenInfoStr) : null;
    } catch {
      return null;
    }
  }

  // 토큰 가져오기
  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  // 화면 이동을 위한 힌트이며 실제 권한은 서버가 JWT 서명과 role로 검사한다.
  static getRole(): string | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      return jwtDecode<{ role?: string }>(token).role ?? null;
    } catch {
      return null;
    }
  }

  // 토큰 삭제
  static removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_INFO_KEY);
  }

  // 토큰 만료 여부 확인
  static isTokenExpired(): boolean {
    const tokenInfo = this.getTokenInfo();
    if (!tokenInfo) return true;

    const now = Date.now();
    const expirationTime = tokenInfo.issuedAt + tokenInfo.expiresIn;
    return now >= expirationTime;
  }

  // 토큰 갱신이 필요한지 확인 (만료 5분 전)
  static shouldRefreshToken(): boolean {
    const tokenInfo = this.getTokenInfo();
    if (!tokenInfo) return false;

    const now = Date.now();
    const expirationTime = tokenInfo.issuedAt + tokenInfo.expiresIn;
    const refreshTime = expirationTime - (this.REFRESH_THRESHOLD * 60 * 1000);
    
    return now >= refreshTime && now < expirationTime;
  }

  // 토큰 갱신
  static async refreshToken(): Promise<boolean> {
    try {
      const response = await defaultInstance.post("/auth/reissue", {});
      const newAccessToken = response.headers["authorization"];
      
      if (!newAccessToken) {
        throw new Error("새로운 Access Token이 응답 헤더에 없습니다.");
      }

      // 새로운 토큰 저장
      this.setToken(newAccessToken);
      return true;

    } catch (error) {
      console.error("토큰 갱신에 실패했습니다.");
      
      // 갱신 실패 시 로그아웃 처리
      this.removeToken();
      useUserStore.getState().logout();
      
      return false;
    }
  }

  // 토큰 상태 확인 및 필요시 갱신
  static async checkAndRefreshToken(): Promise<boolean> {
    const token = this.getToken();
    
    // 토큰이 없으면 로그인 필요
    if (!token) {
      return false;
    }

    // 토큰이 이미 만료되었으면 갱신 시도
    if (this.isTokenExpired()) {
      return await this.refreshToken();
    }

    // 토큰 갱신이 필요한 시점이면 갱신
    if (this.shouldRefreshToken()) {
      return await this.refreshToken();
    }

    // 토큰이 유효함
    return true;
  }

  // 토큰 정보 초기화 (기존 토큰이 있지만 정보가 없는 경우)
  static initializeTokenInfo(): void {
    const token = this.getToken();
    const tokenInfo = this.getTokenInfo();

    if (token && !tokenInfo) {
      // 기존 토큰이 있지만 정보가 없으면 현재 시간으로 초기화
      this.setToken(token);
    }
  }
}

export default TokenManager;