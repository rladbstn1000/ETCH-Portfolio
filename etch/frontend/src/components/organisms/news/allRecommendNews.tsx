import type { News } from "../../../types/newsTypes";
import RecommendCard from "../../molecules/news/recommendList";
interface Props {
  newsData: News[];
}

function AllRecommendNews({ newsData }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="border-b border-gray-200 p-6">
          <h3 className="text-lg font-semibold">추천 뉴스</h3>
          <p className="text-sm text-gray-500">
            당신의 관심 기업과 뉴스 기록을 바탕으로 추천드립니다
          </p>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {newsData.slice(0, 4).map((news, index) => (
              <RecommendCard key={news.id || index} type="news" {...news} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AllRecommendNews;
