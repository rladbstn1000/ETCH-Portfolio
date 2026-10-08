import { useState, useEffect } from "react";
import { getExpiringJobs } from "../api/jobApi";
import type { Job } from "../types/job";
import type { JobItemProps } from "../components/atoms/listItem";

// Job API 데이터를 JobItemProps로 변환하는 함수
const convertJobToJobItem = (job: Job): JobItemProps => ({
  id: job.id.toString(),
  title: job.title,
  companyName: job.companyName,
  companyId: job.companyId,
  regions: job.regions,
  industries: job.industries,
  jobCategories: job.jobCategories,
  workType: job.workType,
  educationLevel: job.educationLevel,
  openingDate: job.openingDate,
  expirationDate: job.expirationDate
});

export const useExpiringJobs = () => {
  const [jobs, setJobs] = useState<JobItemProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 마감 임박 채용공고 로드 함수
  const loadExpiringJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 오늘부터 5일 후까지의 마감 예정 채용공고 조회
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 5);
      
      const jobsData = await getExpiringJobs({
        start: today.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      });
      
      const convertedJobs = jobsData.map(convertJobToJobItem);
      setJobs(convertedJobs);
    } catch (err) {
      console.error('마감 임박 채용공고 로딩 실패:', err);
      setError('채용공고를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadExpiringJobs();
  }, []);

  return {
    jobs,
    loading,
    error,
    refetch: loadExpiringJobs
  };
};