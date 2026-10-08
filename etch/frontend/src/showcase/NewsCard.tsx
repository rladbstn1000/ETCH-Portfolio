import { useSyncExternalStore } from "react";
import type { NewsCardProps } from "../components/atoms/card";
import HeartSVG from "../components/svg/heartSVG";
import { likeApi } from "./api/likeApi";
import { getShowcaseVersion, subscribeShowcase, showcaseState } from "./state";

export default function NewsCard({ id, title, description, publishedAt, companyName, onLikeStateChange }: NewsCardProps & { isLiked?: boolean; onLikeStateChange?: (id: number, liked: boolean) => void }) {
  useSyncExternalStore(subscribeShowcase, getShowcaseVersion);
  const liked = showcaseState.likes.news.includes(id);
  return <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
    <div className="flex items-start gap-3"><details className="min-w-0 flex-1"><summary className="cursor-pointer font-semibold leading-relaxed hover:text-blue-700">{title}</summary><p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-gray-600">{description || "등록된 요약이 없습니다."}</p><p className="mt-3 rounded-lg bg-blue-50 p-3 text-xs text-blue-900">새로 작성한 가상 기사입니다. 외부 원문은 제공하지 않습니다.</p></details>
      <button aria-label={`예시 뉴스 스크랩: ${title}`} aria-pressed={liked} className={`rounded-full p-2 ${liked ? "text-red-500" : "text-gray-400"}`} onClick={async () => { if (liked) await likeApi.news.removeLike(id); else await likeApi.news.addLike(id); onLikeStateChange?.(id, !liked); }}><HeartSVG filled={liked} /></button></div>
    <p className="mt-3 text-xs text-gray-500">{publishedAt || "날짜 없음"} · {companyName || "가상 편집부"} · 제목을 눌러 요약 보기</p>
  </article>;
}
