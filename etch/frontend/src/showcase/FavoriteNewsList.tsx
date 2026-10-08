import { useSyncExternalStore } from "react";
import NewsCard from "./NewsCard";
import { getShowcaseVersion, subscribeShowcase, showcaseState } from "./state";

export default function FavoriteNewsList({ titleText }: { titleText: string; subText: string }) {
  useSyncExternalStore(subscribeShowcase, getShowcaseVersion);
  const items = showcaseState.news.filter(news => showcaseState.likes.news.includes(news.id));
  return <section className="flex h-[500px] flex-col rounded-xl border border-gray-100 bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">{titleText} ({items.length})</h2><p className="mb-4 mt-1 text-sm text-gray-500">메모리에 스크랩한 예시 기사</p><div className="space-y-3 overflow-y-auto">{items.map(news => <NewsCard key={news.id} type="news" {...news} companyName={news.company?.name} />)}{!items.length && <p className="py-8 text-center text-gray-500">관심 뉴스가 없습니다</p>}</div></section>;
}
