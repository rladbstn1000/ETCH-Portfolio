import { create } from 'zustand';
import type { MemberInfo } from '../types/memberInfo';
import { virtualMember } from './data';
import { resetShowcase } from './state';
interface UserState { memberInfo: MemberInfo; isLoggedIn: boolean; setMemberInfo: (value: MemberInfo) => void; logout: () => void; }
// 기존 화면의 사용자 인터페이스만 제공한다. 실제 인증/토큰/브라우저 저장소는 없다.
const useUserStore = create<UserState>(() => ({
  memberInfo: { ...virtualMember }, isLoggedIn: true,
  setMemberInfo: () => {}, logout: resetShowcase,
}));
export default useUserStore;
export { useUserStore };
