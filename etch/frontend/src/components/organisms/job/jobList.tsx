import JobListItem from "../../molecules/job/jobListItem";
import type { JobItemProps } from "../../atoms/listItem";
import { useLikedJobs } from "../../../hooks/useLikedItems";

interface JobListProps {
  jobs: JobItemProps[];
  onJobClick?: (jobId: string) => void;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export default function JobList({ jobs, onJobClick, dateRange }: JobListProps) {
  const { isJobLiked, addLikedJob, removeLikedJob } = useLikedJobs();

  const handleLikeStateChange = (jobId: number, isLiked: boolean) => {
    if (isLiked) {
      addLikedJob(jobId);
    } else {
      removeLikedJob(jobId);
    }
  };

  const getCurrentMonth = (start: Date, end: Date) => {
    // 시작일과 종료일의 중간 지점을 계산하여 주요 월 결정
    const midPoint = new Date((start.getTime() + end.getTime()) / 2);
    return midPoint.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
    });
  };

  return (
    <div className="p-4">
      {/* 헤더 섹션 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-semibold text-gray-900 text-1xl">
              {dateRange
                ? `${getCurrentMonth(dateRange.start, dateRange.end)} 채용공고`
                : "채용공고 목록"}
            </h1>
          </div>
          <div className="text-sm text-gray-500">
            총{" "}
            <span className="font-semibold text-blue-600">{jobs.length}</span>개
          </div>
        </div>
      </div>

      {/* 채용공고 그리드 */}
      {jobs.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <JobListItem
              key={job.id}
              {...job}
              onClick={onJobClick}
              isLiked={isJobLiked(Number(job.id))}
              onLikeStateChange={handleLikeStateChange}
            />
          ))}
        </div>
      ) : (
        /* 빈 상태 UI */
        <div className="flex flex-col items-center justify-center py-16 rounded-lg bg-gray-50">
          <div className="mb-4 text-6xl">📋</div>
          <h3 className="mb-2 text-lg font-semibold text-gray-700">
            채용공고가 없습니다
          </h3>
          <p className="max-w-md text-center text-gray-500">
            {dateRange
              ? `${getCurrentMonth(
                  dateRange.start,
                  dateRange.end
                )}에는 등록된 채용공고가 없습니다.`
              : "현재 등록된 채용공고가 없습니다."}
          </p>
          <p className="mt-2 text-sm text-gray-400">
            다른 기간을 선택하거나 나중에 다시 확인해주세요.
          </p>
        </div>
      )}
    </div>
  );
}
