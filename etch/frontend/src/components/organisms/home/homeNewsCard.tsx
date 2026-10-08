import type { News } from "../../../types/newsTypes";
import NewsCard from "../../molecules/home/newsCard";
import { useLikedNews } from "../../../hooks/useLikedItems";

interface Props {
  newsData: News[];
}

function HomeNewsCard({ newsData }: Props) {
  const { isNewsLiked, addLikedNews, removeLikedNews } = useLikedNews();

  const handleLikeStateChange = (newsId: number, isLiked: boolean) => {
    if (isLiked) {
      addLikedNews(newsId);
    } else {
      removeLikedNews(newsId);
    }
  };

  return (
    <div className="space-y-3">
      {newsData.slice(0, 5).map((news) => (
        <NewsCard 
          key={news.id} 
          {...news} 
          type="news"
          isLiked={isNewsLiked(news.id)}
          onLikeStateChange={handleLikeStateChange}
        />
      ))}
    </div>
  );
}

export default HomeNewsCard;
