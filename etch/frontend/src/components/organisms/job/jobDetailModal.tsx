import { useDialogFocus } from "../../../hooks/useDialogFocus";
import { DEMO_MODE } from "../../../config/demo";
import { useState, useEffect } from "react";
import type { JobItemProps } from "../../atoms/listItem";
import JobDetailTabs from "../../molecules/job/jobDetailTabs";
import JobDetailTabContent from "../../molecules/job/jobDetailTabContent";
import { useJobDetail } from "../../../hooks/useJobDetail";
import { applyJob } from "../../../api/appliedJobApi";
import { likeApi } from "../../../api/likeApi";

interface JobDetailModalProps {
  job: JobItemProps;
  onClose: () => void;
}

export default function JobDetailModal({ job, onClose }: JobDetailModalProps) {
  const dialog = useDialogFocus(onClose);
  const [activeTab, setActiveTab] = useState<"details" | "company" | "news">(
    "details"
  );
  const [isApplying, setIsApplying] = useState(false);
  const [isAddingToFavorite, setIsAddingToFavorite] = useState(false);
  // 관심등록 완료 상태 유지 (API 성공 시 true)
  const [isFavorited, setIsFavorited] = useState(false);

  const {
    jobDetail,
    companyInfo,
    companyNews,
    isLoading,
    jobError,
    companyError,
    newsError,
  } = useJobDetail(job.id, job.companyId);

  const handleApplyJob = async () => {
    try {
      setIsApplying(true);
      await applyJob(Number(job.id));
      alert("마이페이지의 지원현황에 추가되었습니다!");
    } catch (error: any) {
      console.error("지원하기 실패:", error);
      if (error.response?.data.message === "이미 지원한 공고입니다.") {
        alert("이미 지원한 공고입니다.");
      } else {
        alert("지원하기에 실패했습니다. 다시 시도해주세요.");
      }
    } finally {
      setIsApplying(false);
    }
  };

  const handleAddToFavorite = async () => {
    if (isAddingToFavorite || isFavorited) return;
    try {
      setIsAddingToFavorite(true);
      await likeApi.companies.addLike(Number(job.companyId));
      setIsFavorited(true); // 성공 시 상태 반영
      alert("관심기업으로 등록되었습니다!");
    } catch (error: any) {
      console.error("관심기업 등록 실패:", error);
      if (error.response?.data.message === "이미 좋아요를 누른 콘텐츠입니다.") {
        setIsFavorited(true); // 이미 등록된 경우에도 UI 반영
        alert("이미 관심기업으로 등록된 회사입니다.");
      } else {
        alert("관심기업 등록에 실패했습니다. 다시 시도해주세요.");
      }
    } finally {
      setIsAddingToFavorite(false);
    }
  };

  // 모달 열릴 때 바디 스크롤 잠금 (원래 동작 유지)
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow || "unset";
    };
  }, []);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30"
      onClick={handleOverlayClick}
    >
      <div ref={dialog} role="dialog" aria-modal="true" aria-label={`채용 상세: ${job.title}`} tabIndex={-1} className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* 헤더 - 단색, 타이틀/회사명 표시 */}
        <div className="flex items-start justify-between gap-4 px-6 py-4 bg-white border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 break-words">
              {job.title}
            </h2>
            <p className="mt-1 text-sm text-gray-600">{job.companyName}</p>
          </div>
          <div>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 rounded-md hover:bg-gray-50"
              aria-label="모달 닫기"
            >
              ×
            </button>
          </div>
        </div>

        {/* Tabs */}
        <JobDetailTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Content: 고정된 정확한 높이로 설정하여 레이아웃 고정 (스크롤바 위치 고정) */}
        {/* 고정 높이: h-[60vh] 사용 → 모달 본문 높이가 항상 동일하게 유지되어 스크롤바 위치가 안 움직임 */}
        {/* 만약 내용이 부족해도 스크롤 바 자리(트랙)를 항상 보이게 하려면 overflow-y-scroll로 변경하세요. */}
        <div className="h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-lg text-gray-600">
                데이터를 불러오는 중...
              </div>
            </div>
          ) : (
            <div className="min-h-full">
              <JobDetailTabContent
                activeTab={activeTab}
                job={job}
                jobDetail={jobDetail}
                companyInfo={companyInfo}
                companyNews={companyNews}
                errors={{
                  jobError,
                  companyError,
                  newsError,
                }}
              />
            </div>
          )}
        </div>

        {/* Footer actions */}
        <footer className="flex items-center justify-between gap-3 px-6 py-4 bg-white border-t border-gray-100">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-2 text-sm text-gray-700 border border-gray-100 rounded-md hover:bg-gray-50"
            >
              닫기
            </button>
          </div>

          {DEMO_MODE ? <p className="text-xs text-gray-600">가상 공고 · 지원·관심 저장은 제공하지 않습니다.</p> : <div className="flex items-center gap-3">
            {/* 관심기업 버튼 - 지원하기 버튼과 동일한 크기/높이로 통일 */}
            <button
              onClick={handleAddToFavorite}
              disabled={isAddingToFavorite || isFavorited}
              aria-label="관심기업 토글"
              aria-pressed={isFavorited}
              className={`inline-flex items-center justify-center gap-2 px-4 py-2 h-10 text-sm font-medium rounded-md shadow-sm border transition-colors ${
                isFavorited
                  ? "bg-pink-600 text-white border-pink-600"
                  : isAddingToFavorite
                  ? "bg-white text-gray-400 border-gray-200 cursor-not-allowed"
                  : "bg-white text-pink-600 border-pink-200 hover:bg-pink-50"
              }`}
            >
              {/* 아이콘 크기/정렬 통일 */}
              {isAddingToFavorite ? (
                <svg
                  className="w-4 h-4 text-current animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    opacity="0.25"
                  />
                  <path
                    d="M22 12a10 10 0 00-10-10"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              ) : isFavorited ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.657L10 17.657l-6.828-6.828a4 4 0 010-5.657z" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 10-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z"
                  />
                </svg>
              )}

              <span className="whitespace-nowrap">
                {isAddingToFavorite
                  ? "등록 중..."
                  : isFavorited
                  ? "관심등록됨"
                  : "관심기업"}
              </span>
            </button>

            <button
              onClick={handleApplyJob}
              disabled={isApplying}
              aria-label="지원하기"
              className={`px-4 py-2 h-10 text-sm font-medium rounded-md shadow-sm transition-colors ${
                isApplying
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              <span>{isApplying ? "지원 중..." : "지원하기"}</span>
            </button>
          </div>}
        </footer>
      </div>
    </div>
  );
}
