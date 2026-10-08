import { notifyUser, confirmUser } from "../../../config/experienceText";
import { useState } from "react";
import ApplicationStats from "../../organisms/mypage/application/applicationStats";
import ApplicationList from "../../organisms/mypage/application/applicationList";
import UpcomingDeadlines from "../../organisms/mypage/application/upcomingDeadlines";
import JobDetailModal from "../../organisms/job/jobDetailModal";
import StatusChangeModal from "../../organisms/mypage/statusChangeModal";
import { getJob } from "../../../api/jobApi";
import { useAppliedJobs } from "../../../hooks/useAppliedJobs";
import type { AppliedJobListResponse } from "../../../types/appliedJob";
import type { JobItemProps } from "../../atoms/listItem";
import type { Job } from "../../../types/job";

function MypageApplicationsPage() {
  // Custom hook으로 지원 관련 로직 관리
  const {
    appliedJobs,
    statusCodes,
    loading,
    error,
    loadInitialData,
    updateJobStatus,
    removeAppliedJob,
    applicationStats,
    upcomingDeadlines,
    enhancedApplications,
  } = useAppliedJobs();

  // 모달 상태 관리
  const [selectedJob, setSelectedJob] = useState<JobItemProps | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [statusChangeModalJob, setStatusChangeModalJob] = useState<AppliedJobListResponse | null>(null);

  // Job 타입을 JobItemProps로 변환
  const convertJobToJobItemProps = (job: Job): JobItemProps => {
    return {
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
      expirationDate: job.expirationDate,
    };
  };

  // 상태 변경 모달 열기
  const handleStatusChange = (appliedJobId: string) => {
    const appliedJob = appliedJobs.find(job => job.appliedJobId.toString() === appliedJobId);
    if (appliedJob) {
      setStatusChangeModalJob(appliedJob);
    }
  };

  // 상태 변경 API 호출 (custom hook의 함수 사용)
  const handleStatusUpdate = async (appliedJobId: number, newStatus: string) => {
    try {
      await updateJobStatus(appliedJobId, newStatus);
    } catch (err) {
      console.error("상태 변경 실패:", err);
      throw err; // 모달에서 에러 처리를 위해 다시 throw
    }
  };

  // 상태 변경 모달 닫기
  const handleStatusChangeModalClose = () => {
    setStatusChangeModalJob(null);
  };

  // 지원 삭제 핸들러 (custom hook의 함수 사용)
  const handleDelete = async (appliedJobId: string) => {
    if (!confirmUser("정말로 이 지원을 삭제하시겠습니까?")) return;
    
    try {
      await removeAppliedJob(Number(appliedJobId));
    } catch (err) {
      console.error("지원 삭제 실패:", err);
      notifyUser("지원 삭제에 실패했습니다.");
    }
  };

  // ApplicationItem 클릭 시 채용공고 모달 열기
  const handleItemClick = async (id: string) => {
    try {
      setModalLoading(true);
      
      // appliedJobId를 통해 해당 지원 정보 찾기
      const appliedJob = appliedJobs.find(job => job.appliedJobId.toString() === id);
      if (!appliedJob) {
        console.error("Applied job not found:", id);
        return;
      }

      // jobId로 실제 채용공고 정보 가져오기
      const jobDetail = await getJob(appliedJob.jobId);
      const jobItemProps = convertJobToJobItemProps(jobDetail);
      setSelectedJob(jobItemProps);
    } catch (err) {
      console.error("채용공고 상세 정보 로딩 실패:", err);
      notifyUser("채용공고 정보를 불러올 수 없습니다.");
    } finally {
      setModalLoading(false);
    }
  };

  // 모달 닫기
  const handleCloseModal = () => {
    setSelectedJob(null);
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-b-2 border-blue-600 rounded-full animate-spin"></div>
        <span className="ml-2">지원 목록을 불러오는 중...</span>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="p-6 text-center bg-white rounded-lg">
        <div className="mb-4 text-4xl text-red-500">⚠️</div>
        <p className="font-medium text-red-600">{error}</p>
        <button
          onClick={loadInitialData}
          className="px-4 py-2 mt-4 text-sm text-white bg-red-500 rounded-lg hover:bg-red-600"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ApplicationStats stats={applicationStats} />
      <ApplicationList
        applications={enhancedApplications}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
        onClick={handleItemClick}
      />
      <UpcomingDeadlines deadlines={upcomingDeadlines} onClick={handleItemClick} />
      
      {/* 채용공고 상세 모달 */}
      {selectedJob && (
        <JobDetailModal job={selectedJob} onClose={handleCloseModal} />
      )}

      {/* 상태 변경 모달 */}
      {statusChangeModalJob && (
        <StatusChangeModal
          appliedJob={statusChangeModalJob}
          statusCodes={statusCodes}
          onStatusChange={handleStatusUpdate}
          onClose={handleStatusChangeModalClose}
        />
      )}
      
      {/* 모달 로딩 상태 */}
      {modalLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="p-6 bg-white rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 border-b-2 border-blue-600 rounded-full animate-spin"></div>
              <span>채용공고 정보를 불러오는 중...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default MypageApplicationsPage;
