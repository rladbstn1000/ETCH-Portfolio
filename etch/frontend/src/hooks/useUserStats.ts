import { useState, useEffect } from 'react';
import type { UserStats } from '../types/userStats';
import { getAppliedJobsList } from '../api/appliedJobApi';
import { likeApi } from '../api/likeApi';
import { getMyProjects } from '../api/projectApi';
import useUserStore from '../store/userStore';

export const useUserStats = () => {
  const [stats, setStats] = useState<UserStats>({
    applicationCount: 0,
    favoriteCompanyCount: 0,
    projectCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isLoggedIn, memberInfo } = useUserStore();

  useEffect(() => {
    const fetchUserStats = async () => {
      if (!isLoggedIn || !memberInfo?.id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // 병렬로 3개 API 호출
        const [appliedJobs, favoriteCompanies, myProjects] = await Promise.all([
          getAppliedJobsList().catch(() => []), // 실패시 빈 배열
          likeApi.companies.getLikes().catch(() => []), // 실패시 빈 배열  
          getMyProjects().catch(() => []), // 내 프로젝트 조회로 변경
        ]);

        // 진행중인 지원 카운트 (상태별 필터링 필요시)
        const applicationCount = appliedJobs.length;
        
        // 관심 기업 카운트
        const favoriteCompanyCount = favoriteCompanies.length;
        
        // 내 프로젝트 카운트
        const projectCount = myProjects.length;

        setStats({
          applicationCount,
          favoriteCompanyCount,
          projectCount,
        });

      } catch (err) {
        console.error('사용자 통계 로딩 실패:', err);
        setError('통계 데이터를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserStats();
  }, [isLoggedIn, memberInfo?.id]);

  return {
    stats,
    isLoading,
    error,
  };
};