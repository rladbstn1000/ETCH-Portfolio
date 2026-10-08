import JobListItem from "../../molecules/job/jobListItem";
import type { JobItemProps } from "../../atoms/listItem";
import { useLikedJobs } from "../../../hooks/useLikedItems";

interface SearchJobListProps {
  jobs: JobItemProps[];
  onJobClick?: (jobId: string) => void;
  maxItems?: number;
  gridCols?: string;
}

export default function SearchJobList({ 
  jobs, 
  onJobClick, 
  maxItems = 4,
  gridCols = "grid-cols-1 md:grid-cols-2"
}: SearchJobListProps) {
  const { isJobLiked, addLikedJob, removeLikedJob } = useLikedJobs();

  const handleLikeStateChange = (jobId: number, isLiked: boolean) => {
    if (isLiked) {
      addLikedJob(jobId);
    } else {
      removeLikedJob(jobId);
    }
  };

  const displayJobs = jobs.slice(0, maxItems);

  return (
    <div className="p-4">
      {/* 채용공고 그리드 - 검색용 레이아웃 */}
      {displayJobs.length > 0 ? (
        <div className={`grid ${gridCols} gap-4`}>
          {displayJobs.map((job) => (
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
            검색 결과에 맞는 채용공고가 없습니다.
          </p>
        </div>
      )}
    </div>
  );
}