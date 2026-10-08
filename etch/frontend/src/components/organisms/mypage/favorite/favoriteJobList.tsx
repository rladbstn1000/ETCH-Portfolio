import { notifyUser, confirmUser } from "../../../../config/experienceText";
import { useState, useEffect } from "react";
import { likeApi } from "../../../../api/likeApi";
import { getJob } from "../../../../api/jobApi";
import type { JobLike } from "../../../../types/like";
import type { JobItemProps } from "../../../atoms/listItem";
import type { Job } from "../../../../types/job";
import JobDetailModal from "../../job/jobDetailModal";

interface Props {
  titleText: string;
  subText: string;
}

function FavoriteJobList({ titleText, subText }: Props) {
  const [jobs, setJobs] = useState<JobLike[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<JobItemProps | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    const fetchFavoriteJobs = async () => {
      try {
        setIsLoading(true);
        const data = await likeApi.jobs.getLikes();
        setJobs(data);
      } catch (error: any) {
        console.error("관심공고 목록 조회:", error);
        // 400 에러는 데이터가 없음을 의미하므로 빈 배열로 처리
        if (error.response?.status === 400) {
          setJobs([]);
        } else {
          console.error("예상치 못한 에러:", error);
          setJobs([]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavoriteJobs();
  }, []);

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

  // 관심공고 클릭 시 모달 열기
  const handleJobClick = async (jobId: number) => {
    try {
      setModalLoading(true);
      const jobDetail = await getJob(jobId);
      const jobItemProps = convertJobToJobItemProps(jobDetail);
      setSelectedJob(jobItemProps);
    } catch (error) {
      console.error("채용공고 상세 정보 로딩 실패:", error);
      notifyUser("채용공고 정보를 불러올 수 없습니다.");
    } finally {
      setModalLoading(false);
    }
  };

  // 모달 닫기
  const handleCloseModal = () => {
    setSelectedJob(null);
  };

  const handleRemoveJob = async (jobId: number, jobTitle: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 클릭 이벤트 전파 방지
    
    if (!confirmUser(`'${jobTitle}'을(를) 관심공고에서 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await likeApi.jobs.removeLike(jobId);
      setJobs(jobs.filter(job => job.id !== jobId));
      notifyUser("관심공고에서 삭제되었습니다.");
    } catch (error) {
      console.error("관심공고 삭제 실패:", error);
      notifyUser("관심공고 삭제에 실패했습니다. 다시 시도해주세요.");
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-fit">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-[500px] flex flex-col">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">
            {titleText} ({jobs.length})
          </h1>
          <p className="text-sm text-gray-500">{subText}</p>
        </div>
      </div>
      
      {/* List Section - 스크롤 가능 */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {jobs.length > 0 ? (
          jobs.map((job) => (
            <div 
              key={job.id} 
              className="flex items-start justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              onClick={() => handleJobClick(job.id)}
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 mb-1 truncate">{job.title}</h3>
                <p className="text-sm text-gray-600 mb-2 truncate">{job.companyName}</p>
                <div className="flex flex-wrap gap-1 mb-2">
                  {job.regions?.slice(0, 2).map((region, index) => (
                    <span key={index} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                      {region}
                    </span>
                  ))}
                  {job.jobCategories?.slice(0, 1).map((category, index) => (
                    <span key={index} className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                      {category}
                    </span>
                  ))}
                </div>
                <div className="text-xs text-gray-500">
                  마감: {new Date(job.expirationDate).toLocaleDateString()}
                </div>
              </div>
              <button
                onClick={(e) => handleRemoveJob(job.id, job.title, e)}
                className="ml-3 p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors flex-shrink-0"
                title="관심공고 삭제"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-gray-500 text-sm font-medium">
              관심 공고가 없습니다
            </p>
            <p className="text-gray-400 text-xs mt-1">
              관심있는 채용공고를 북마크해보세요
            </p>
          </div>
        )}
      </div>

      {/* 채용공고 상세 모달 */}
      {selectedJob && (
        <JobDetailModal job={selectedJob} onClose={handleCloseModal} />
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

export default FavoriteJobList;
