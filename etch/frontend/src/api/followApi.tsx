import { authInstance } from "./instances";
import type { UserProfile } from "../types/userProfile";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string | null;
}

interface Follows {
  followerCount: number;
  followingCount: number;
}

export const getFollowers = async (): Promise<UserProfile[]> => {
  const response = await authInstance.get<ApiResponse<UserProfile[]>>(
    `/follows/followers`
  );
  return response.data.data;
};

export const getFollowings = async (): Promise<UserProfile[]> => {
  const response = await authInstance.get<ApiResponse<UserProfile[]>>(
    `/follows/following`
  );
  return response.data.data;
};

export const getCountFollows = async (userId: number): Promise<Follows> => {
  const response = await authInstance.get<ApiResponse<Follows>>(
    `/follows/${userId}`
  );
  return response.data.data;
};

// 특정 사용자를 팔로우하고 있는지 확인
export const checkFollowExists = async (userId: number): Promise<boolean> => {
  const response = await authInstance.get<ApiResponse<boolean>>(
    `/follows/exists/${userId}`
  );
  return response.data.data;
};

// 특정 사용자를 팔로우
export const followUser = async (userId: number): Promise<void> => {
  await authInstance.post(`/follows/${userId}`);
};

// 특정 사용자를 언팔로우
export const unfollowUser = async (userId: number): Promise<void> => {
  await authInstance.delete(`/follows/${userId}`);
};
