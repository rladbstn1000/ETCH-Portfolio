import { useState, useEffect } from 'react';
import { getFollowers, getFollowings } from '../api/followApi';
import type { UserProfile } from '../types/userProfile'; // UserProfile import

// 'followers' 또는 'following' 타입을 명시적으로 지정
type FollowListType = 'followers' | 'following';

export const useFollowList = (type: FollowListType) => {
  const [userList, setUserList] = useState<UserProfile[]>([]); // 타입 변경
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchList = async () => {
      setIsLoading(true);
      try {
        // 타입에 따라 적절한 API 함수를 호출
        const data = type === 'followers' ? await getFollowers() : await getFollowings();
        setUserList(data);
      } catch (err) {
        console.error(`Failed to fetch ${type}:`, err);
        setError('목록을 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchList();
    // type이 바뀔 때마다 훅을 다시 실행
  }, [type]);

  return { userList, isLoading, error };
};
