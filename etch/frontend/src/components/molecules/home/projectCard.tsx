import { Link } from "react-router";
import type { ProjectCardProps } from "../../atoms/card";

function ProcjectCard({ id, title, content, thumbnailUrl }: ProjectCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      <Link to={`/projects/${id}`}>
        <section className="w-full h-36">
          <img
            className="w-full object-cover h-full"
            src={thumbnailUrl}
            alt="카드 이미지"
            width={400}
            height={144}
            style={{ aspectRatio: '400/144' }}
          />
        </section>
        <section className="p-3 sm:p-4">
          <div className="text-lg sm:text-xl lg:text-2xl font-bold line-clamp-2 text-gray-800 mb-2">
            {title}
          </div>
          <div className="text-sm sm:text-base text-gray-600 line-clamp-2">
            {content}
          </div>
        </section>
      </Link>
    </div>
  );
}
export default ProcjectCard;
