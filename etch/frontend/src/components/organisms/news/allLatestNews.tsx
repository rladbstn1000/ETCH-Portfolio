import type { News } from "../../../types/newsTypes";
import LatestCard from "../../molecules/news/latestList";
import { useLikedNews } from "../../../hooks/useLikedItems";
interface Props {
  newsData: News[];
}

function AllLatestNews({ newsData }: Props) {
  const { isNewsLiked, addLikedNews, removeLikedNews } = useLikedNews();

  const handleLikeStateChange = (newsId: number, isLiked: boolean) => {
    if (isLiked) {
      addLikedNews(newsId);
    } else {
      removeLikedNews(newsId);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {newsData.slice(0, 10).map((news) => {
        // index 제거
        // 각 뉴스 항목 검증
        if (!news || !news.id) {
          return null;
        }

        return (
          <LatestCard 
            key={news.id} 
            type="news" 
            {...news}
            isLiked={isNewsLiked(news.id)}
            onLikeStateChange={handleLikeStateChange}
          />
        );
      })}
    </div>
  );
}

export default AllLatestNews;
