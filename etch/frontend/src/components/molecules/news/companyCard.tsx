import { Link } from "react-router";
import type { CompanyCardProps } from "../../atoms/card";
import BuildingSVG from "../../svg/buildingSVG";

function CompanyCard({ companyName, like }: CompanyCardProps) {
  return (
    <div className="w-full min-w-0 overflow-hidden transition-shadow duration-300 bg-white rounded-lg shadow-md sm:rounded-xl lg:rounded-2xl hover:shadow-lg relative">
      
      <Link to={`/search?q=${companyName}`} className="block p-4 sm:p-6">
        {/* 회사명과 아이콘 */}
        <div className="flex flex-col items-center justify-center min-h-[80px] sm:min-h-[100px]">
          {/* 회사 아이콘 */}
          <div className="flex items-center justify-center w-12 h-12 mb-3 bg-blue-100 rounded-full sm:w-16 sm:h-16">
            <BuildingSVG className="w-6 h-6 text-blue-600 sm:w-8 sm:h-8" />
          </div>

          {/* 회사명 */}
          <div className="max-w-full mb-2 text-sm font-bold text-center text-gray-800 truncate sm:text-base lg:text-lg">
            {companyName}
          </div>

          {/* 좋아요 */}
          <div className="flex items-center text-xs text-gray-600 sm:text-sm">
            <svg
              className="w-3 h-3 mr-1 sm:w-4 sm:h-4 fill-red-500"
              viewBox="0 0 24 24"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <span className="font-medium">{like}</span>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default CompanyCard;
