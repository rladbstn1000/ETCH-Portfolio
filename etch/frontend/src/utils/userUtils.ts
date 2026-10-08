import useUserStore from '../store/userStore';

export const getCurrentUserId = (): number => {
  const { memberInfo } = useUserStore.getState();
  return memberInfo?.id || 0;
};

export const getCurrentUserName = (): string => {
  const { memberInfo } = useUserStore.getState();
  return memberInfo?.nickname || '익명';
};

export const getAccessToken = (): string | null => {
  const token = localStorage.getItem("access_token");
  
  if (!token) {
    return null;
  }
  
  return token;
};
