import JobListItem from "../../molecules/job/jobListItem";
import type { Job } from "../../../types/job";
import { useLikedJobs } from "../../../hooks/useLikedItems";

interface RecommendedJobsProps {
  jobs: Job[];
  onJobClick?: (jobId: string) => void;
}

const RecommendedJobs = ({ jobs, onJobClick }: RecommendedJobsProps) => {
  const { isJobLiked, addLikedJob, removeLikedJob } = useLikedJobs();

  const handleLikeStateChange = (jobId: number, isLiked: boolean) => {
    if (isLiked) {
      addLikedJob(jobId);
    } else {
      removeLikedJob(jobId);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold">추천 채용 공고</h3>
        <p className="text-sm text-gray-500">
          당신의 관심사와 지원 이력을 바탕으로 추천드립니다
        </p>
      </div>
      <div className="p-6">
        {jobs.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <div className="mb-2 text-2xl">💼</div>
            <p>추천 채용 공고가 없습니다</p>
            <p className="text-sm">관심 기업이나 직무에 좋아요를 눌러보세요</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.slice(0, 5).map((job) => (
              <JobListItem
                key={job.id}
                id={job.id.toString()}
                title={job.title}
                companyName={job.companyName}
                companyId={job.companyId}
                regions={job.regions}
                industries={job.industries}
                jobCategories={job.jobCategories}
                workType={job.workType}
                educationLevel={job.educationLevel}
                openingDate={job.openingDate}
                expirationDate={job.expirationDate}
                onClick={onJobClick}
                isLiked={isJobLiked(job.id)}
                onLikeStateChange={handleLikeStateChange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecommendedJobs;
