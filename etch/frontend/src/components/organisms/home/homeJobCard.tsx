import type { Job } from "../../../types/job";
import JobCard from "../../molecules/home/jobCard";

interface Props {
  jobs: Job[];
}

function HomeJobCard({ jobs }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {jobs.slice(0, 3).map((job) => (
        <JobCard 
          type="job" 
          {...job}
          createTime={new Date(job.openingDate)}
        />
      ))}
    </div>
  );
}

export default HomeJobCard;
