import React, { useState } from "react";
import { getJobsList } from "../api/jobApi";
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

export const useJobs = () => {
  const [jobs, setJobs] = useState<JobItemProps[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);

  // 채용공고 데이터 로드 함수
  const loadJobs = async (startDate: Date, endDate: Date) => {
    
    // 이미 로딩 중이면 새로운 요청을 무시
    if (loading) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const jobsData = await getJobsList({
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      });
      
      
      const convertedJobs = jobsData.map(convertJobToJobItem);
      
      setJobs(convertedJobs);
    } catch (err) {
      console.error('[loadJobs] API 요청 실패:', err);
      setError('채용공고를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 달력 날짜 범위 변경 시 호출 함수
  const handleDateRangeChange = (startDate: Date, endDate: Date) => {
    setHasInitialLoad(true);
    loadJobs(startDate, endDate);
  };

  // 초기 로드 (CalendarView가 마운트되지 않을 경우 대비)
  React.useEffect(() => {
    if (!hasInitialLoad) {
      const timer = setTimeout(() => {
        if (!hasInitialLoad) {
          const today = new Date();
          const endDate = new Date(today);
          endDate.setDate(today.getDate() + 30);
          handleDateRangeChange(today, endDate);
        }
      }, 1000); // 1초 후에도 로드되지 않으면 수동 로드
      
      return () => {
        clearTimeout(timer);
      };
    }
  }, [hasInitialLoad]);

  return {
    jobs,
    loading,
    error,
    loadJobs,
    handleDateRangeChange
  };
};