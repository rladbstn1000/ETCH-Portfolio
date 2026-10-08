import { useState, useEffect } from "react";
import useUserStore from "../store/userStore";
import { getMemberById } from "../api/memberApi";
import { getCountFollows } from "../api/followApi";
import type { UserProfile } from "../types/userProfile";

export interface ProfileCardData extends UserProfile {
  followerCount: number;
  followingCount: number;
}

export const useUserProfile = (userId?: number) => {
  const { memberInfo } = useUserStore();
  const [profileData, setProfileData] = useState<ProfileCardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // userId가 주어지면 그것을 사용, 없으면 본인 ID 사용
  const targetUserId = userId || memberInfo?.id;

  useEffect(() => {
    // --- 1. 훅 시작 시점의 targetUserId 확인 ---

    if (!targetUserId) {
      setIsLoading(false);
      return;
    }

    const fetchUserProfile = async () => {
      setIsLoading(true);
      try {
        const [memberData, follows] = await Promise.all([
          getMemberById(targetUserId),
          getCountFollows(targetUserId),
        ]);

        // --- 2. API 성공 시 데이터 확인 ---

        const finalData = {
          ...memberData,
          ...follows,
        };

        setProfileData(finalData);
        // --- 3. 최종 데이터 확인 ---
      } catch (err) {
        // --- 4. 에러 발생 시 에러 내용 확인 ---
        console.error("[useUserProfile] API 호출 실패:", err);
        setError("프로필 정보를 불러오는데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [targetUserId]);

  return { profileData, isLoading, error };
};
