import { Link } from "react-router";
import type { JobCardProps } from "../../atoms/card";

function JobCard({ id, title, createTime }: JobCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      <Link to={`/jobs/${id}`}>
        <section className="p-3 sm:p-4">
          <div className="text-lg sm:text-xl lg:text-2xl font-bold mb-2 line-clamp-2 text-gray-800">
            {title}
          </div>
          <div className="text-sm sm:text-base text-gray-500">
            {createTime.toLocaleDateString()}
          </div>
        </section>
      </Link>
    </div>
  );
}
export default JobCard;
