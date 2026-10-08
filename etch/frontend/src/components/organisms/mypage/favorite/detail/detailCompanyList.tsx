import type { FavoriteCompanyProps } from "../../../../atoms/list";
import FavoriteCompanyCard from "../../../../molecules/mypage/favorite/detail/favoriteCompanyCard";

interface Props {
  favoriteData: FavoriteCompanyProps[];
}

function DetailCompanyList({ favoriteData }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-fit space-y-4">
      {/* Grid Section */}
      <div>
        {favoriteData.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {favoriteData.map((data) => (
              <FavoriteCompanyCard key={data.id} {...data} />
            ))}
          </div>
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
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <p className="text-gray-500 text-sm font-medium">
              관심 기업이 없습니다
            </p>
            <p className="text-gray-400 text-xs mt-1">
              관심있는 기업을 팔로우해보세요
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default DetailCompanyList;
