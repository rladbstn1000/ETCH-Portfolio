import type { FavoriteCompanyProps } from "../../../atoms/list";

function FavoriteCompany({ companyName, img }: FavoriteCompanyProps) {
  return (
    <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
      {/* 회사 로고 */}
      <div className="flex-shrink-0">
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
          <img
            src={img}
            alt={`${companyName} 로고`}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* 회사 이름 */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 truncate">{companyName}</h3>
      </div>

      {/* 오른쪽 화살표 아이콘 (선택사항) */}
      <div className="flex-shrink-0">
        <svg
          className="w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </div>
  );
}

export default FavoriteCompany;
