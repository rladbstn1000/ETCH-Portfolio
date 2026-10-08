import { useEffect, useState } from "react";
import type { JobItemProps } from "../components/atoms/listItem";
import JobDetailTabs from "../components/molecules/job/jobDetailTabs";
import JobDetailTabContent from "../components/molecules/job/jobDetailTabContent";
import { useDialogFocus } from "../hooks/useDialogFocus";
import { useJobDetail } from "../hooks/useJobDetail";
import { likeApi } from "./api/likeApi";
import NewsCard from "./NewsCard";

export default function JobDetailModal({ job, onClose }: { job: JobItemProps; onClose: () => void }) {
  const dialog = useDialogFocus(onClose);
  const [tab, setTab] = useState<"details" | "company" | "news">("details");
  const [liked, setLiked] = useState(false);
  const details = useJobDetail(job.id, job.companyId);
  useEffect(() => { const before = document.body.style.overflow; document.body.style.overflow = "hidden"; void likeApi.jobs.getLikes().then(items => setLiked(items.some(item => item.id === Number(job.id)))); return () => { document.body.style.overflow = before; }; }, [job.id]);
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-3" onClick={event => { if (event.currentTarget === event.target) onClose(); }}>
    <div ref={dialog} role="dialog" aria-modal="true" aria-label={`채용 상세: ${job.title}`} tabIndex={-1} className="w-full max-w-4xl overflow-hidden rounded-xl bg-white shadow-2xl">
      <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4"><div className="min-w-0"><h2 className="font-semibold leading-relaxed">{job.title}</h2><p className="mt-1 text-sm text-gray-500">{job.companyName}</p></div><button className="shrink-0 rounded-md px-3 py-2 hover:bg-gray-100" aria-label="모달 닫기" onClick={onClose}>×</button></div>
      <JobDetailTabs activeTab={tab} onTabChange={setTab} />
      <div className="h-[52vh] overflow-y-auto">{tab === "news" ? <div className="space-y-3 p-5">{details.companyNews.map(news => <NewsCard key={news.id} type="news" {...news} companyName={news.company?.name} />)}{!details.companyNews.length && <p>관련 예시 뉴스가 없습니다.</p>}</div> : <JobDetailTabContent activeTab={tab} job={job} jobDetail={details.jobDetail} companyInfo={details.companyInfo} companyNews={[]} errors={{ jobError: details.jobError, companyError: details.companyError, newsError: null }} />}</div>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-5 py-4"><p className="text-xs text-gray-600">가상 공고입니다. 지원서를 제출하지 않습니다.</p><button className="showcase-primary" aria-pressed={liked} onClick={async () => { if (liked) await likeApi.jobs.removeLike(Number(job.id)); else await likeApi.jobs.addLike(Number(job.id)); setLiked(!liked); }}>{liked ? "예시 스크랩 해제" : "예시 스크랩"}</button></footer>
    </div>
  </div>;
}
