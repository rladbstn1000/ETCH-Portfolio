import { useState, useEffect } from "react";
import { getAppliedJobsList, updateAppliedJobStatus, deleteAppliedJob, getApplyStatusCodes } from "../api/appliedJobApi";
import type { AppliedJobListResponse } from "../types/appliedJob";

export const useAppliedJobs = () => {
  const [appliedJobs, setAppliedJobs] = useState<AppliedJobListResponse[]>([]);
  const [statusCodes, setStatusCodes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 초기 데이터 로드 (상태 코드 + 지원 목록)
  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 상태 코드와 지원 목록을 병렬로 로드
      const [codes, jobs] = await Promise.all([
        getApplyStatusCodes(),
        getAppliedJobsList()
      ]);
      
      setStatusCodes(codes);
      setAppliedJobs(jobs);
    } catch (err) {
      console.error("데이터 로딩 실패:", err);
      setError("데이터를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 지원 목록만 다시 로드
  const reloadAppliedJobs = async () => {
    try {
      const jobs = await getAppliedJobsList();
      setAppliedJobs(jobs);
    } catch (err) {
      console.error("지원 목록 로딩 실패:", err);
      setError("지원 목록을 불러오는데 실패했습니다.");
    }
  };

  // 상태 변경 API 호출
  const updateJobStatus = async (appliedJobId: number, newStatus: string) => {
    try {
      await updateAppliedJobStatus(appliedJobId, { status: newStatus });
      // 목록 다시 로드
      await reloadAppliedJobs();
    } catch (err) {
      console.error("상태 변경 실패:", err);
      throw err; // 상위에서 에러 처리
    }
  };

  // 지원 삭제 API 호출
  const removeAppliedJob = async (appliedJobId: number) => {
    try {
      await deleteAppliedJob(appliedJobId);
      // 목록 다시 로드
      await reloadAppliedJobs();
    } catch (err) {
      console.error("지원 삭제 실패:", err);
      throw err; // 상위에서 에러 처리
    }
  };

  // 지원 목록으로부터 통계 생성
  const generateApplicationStats = () => {
    const statusCounts = appliedJobs.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      {
        type: "stats" as const,
        title: "예정",
        value: statusCounts['SCHEDULED'] || 0,
        icon: "🕒",
        color: "text-blue-600"
      },
      {
        type: "stats" as const,
        title: "진행중",
        value: (statusCounts['DOCUMENT_DONE'] || 0) + (statusCounts['INTERVIEW_DONE'] || 0),
        icon: "⚡",
        color: "text-yellow-600"
      },
      {
        type: "stats" as const,
        title: "최종 합격",
        value: statusCounts['FINAL_PASSED'] || 0,
        icon: "✅",
        color: "text-green-600"
      },
      {
        type: "stats" as const,
        title: "탈락",
        value: (statusCounts['DOCUMENT_FAILED'] || 0) + (statusCounts['INTERVIEW_FAILED'] || 0),
        icon: "❌",
        color: "text-red-600"
      }
    ];
  };

  // 마감일이 임박한 지원 목록 생성
  const generateUpcomingDeadlines = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 시간을 00:00:00으로 설정
    
    const deadlines: Array<{
      id: string;
      company: string;
      position: string;
      dueDate: string;
      daysLeft: number;
      urgency: "urgent" | "warning";
    }> = [];

    appliedJobs
      .filter(job => {
        // 예정 상태나 진행중 상태만 포함
        return job.status === 'SCHEDULED' || job.status === 'DOCUMENT_DONE' || job.status === 'INTERVIEW_DONE';
      })
      .forEach(job => {
        const closingDate = new Date(job.closingDate);
        closingDate.setHours(0, 0, 0, 0); // 시간을 00:00:00으로 설정
        
        const timeDiff = closingDate.getTime() - today.getTime();
        const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
        
        // 긴급도 판단 및 필터링
        let urgency: "urgent" | "warning";
        if (daysLeft >= 0 && daysLeft <= 3) {
          urgency = "urgent";
        } else if (daysLeft >= 4 && daysLeft <= 7) {
          urgency = "warning";
        } else {
          return; // 7일 이후는 제외
        }

        deadlines.push({
          id: job.appliedJobId.toString(),
          company: job.companyName,
          position: job.title,
          dueDate: job.closingDate,
          daysLeft: Math.max(0, daysLeft), // 음수면 0으로 표시
          urgency
        });
      });

    // 마감일 순으로 정렬
    return deadlines.sort((a, b) => a.daysLeft - b.daysLeft);
  };

  // AppliedJobListResponse에 statusText 추가
  const enhanceWithStatusText = () => {
    return appliedJobs.map(job => ({
      ...job,
      id: job.appliedJobId.toString(), // BaseListItemProps의 id 추가
      statusText: statusCodes[job.status] || job.status,
    }));
  };

  // 초기 로드
  useEffect(() => {
    loadInitialData();
  }, []);

  return {
    // 상태
    appliedJobs,
    statusCodes,
    loading,
    error,
    
    // 함수
    loadInitialData,
    reloadAppliedJobs,
    updateJobStatus,
    removeAppliedJob,
    
    // 계산된 값
    applicationStats: generateApplicationStats(),
    upcomingDeadlines: generateUpcomingDeadlines(),
    enhancedApplications: enhanceWithStatusText(),
  };
};