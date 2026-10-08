import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { MemberInfo } from "../types/memberInfo";
import TokenManager from "../utils/tokenManager";

// 스토어의 상태(state)와 액션(actions)에 대한 타입 정의
interface UserState {
  memberInfo: MemberInfo | null;
  isLoggedIn: boolean;
  setMemberInfo: (userInfo: MemberInfo) => void;
  logout: () => void;
}

// Zustand 스토어 생성
const useUserStore = create<UserState>()(
  // persist 미들웨어를 사용하여 특정 상태를 스토리지에 저장
  persist(
    (set) => ({
      // 초기 상태
      memberInfo: null,
      isLoggedIn: false,

      // 액션: 사용자 정보와 로그인 상태를 업데이트
      setMemberInfo: (userInfo) => {
        set({ memberInfo: userInfo, isLoggedIn: true });
        // Access Token은 여기서 직접 관리하지 않고,
        // API 요청 로직(e.g., axios interceptor)에서 localStorage를 사용합니다.
      },

      // 액션: 로그아웃 처리
      logout: () => {
        set({ memberInfo: null, isLoggedIn: false });
        // TokenManager를 통해 토큰 정보 삭제
        TokenManager.removeToken();
        // 필요하다면 백엔드에 로그아웃 요청을 보낼 수도 있습니다.
      },
    }),
    {
      name: "user-storage", // 스토리지에 저장될 때 사용될 키 이름
      storage: createJSONStorage(() => sessionStorage), // localStorage 또는 sessionStorage 선택
      // 브라우저를 새로고침해도 로그인 상태를 유지하도록 합니다.
      partialize: (state) => ({
        memberInfo: state.memberInfo,
        isLoggedIn: state.isLoggedIn,
      }),
    }
  )
);

export default useUserStore;
