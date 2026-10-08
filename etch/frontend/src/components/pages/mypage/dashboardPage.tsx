import { features } from "../../../config/features";
import StatsCards from "../../organisms/mypage/statsCards";
import MyDocuments from "../../organisms/mypage/myDocuments";
import RecommendedJobs from "../../organisms/mypage/recommendedJobs";
import RecommendedNews from "../../organisms/mypage/recommendedNews";
import JobDetailModal from "../../organisms/job/jobDetailModal";
import { useEffect, useState } from "react";
import { getRecommendJobs, getRecommendNews } from "../../../api/memberApi";
import type { Job } from "../../../types/job";
import { useMyDocuments } from "../../../hooks/useMyDocuments";
import { useUserStats } from "../../../hooks/useUserStats";
import type { StatsCardData } from "../../atoms/card";

const DashboardPage = () => {
  // ✅ 타입 명시
  const [recommendJobs, setRecommendJobs] = useState<Job[]>([]);
  const [recommendNews, setRecommendNews] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [newsLoading, setNewsLoading] = useState(false);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [newsError, setNewsError] = useState<string | null>(null);

  // Use the new custom hook for documents
  const {
    coverLetters,
    portfolios,
    isLoading,
    error: documentsError,
    refetchCoverLetters,
    refetchPortfolios, // 추가: 포트폴리오 리페치 함수
  } = useMyDocuments();

  // 사용자 통계 데이터
  const { stats, isLoading: statsLoading, error: statsError } = useUserStats();

  useEffect(() => {
    if (!features.recommendations) return;
    const loadData = async () => {
      // 추천 채용 정보 로딩
      try {
        setJobsLoading(true);
        setJobsError(null);
        const jobsData = await getRecommendJobs();
        setRecommendJobs(jobsData);
      } catch (err) {
        console.error("추천 채용 정보 로딩 실패:", err);
        setJobsError("추천 채용 정보를 불러오는데 실패했습니다.");
      } finally {
        setJobsLoading(false);
      }

      // 추천 뉴스 로딩
      try {
        setNewsLoading(true);
        setNewsError(null);
        const newsData = await getRecommendNews();
        setRecommendNews(newsData);
      } catch (err) {
        console.error("추천 뉴스 로딩 실패:", err);
        setNewsError("추천 뉴스를 불러오는데 실패했습니다.");
      } finally {
        setNewsLoading(false);
      }
    };

    loadData();
  }, []);

  // 채용 공고 클릭 핸들러
  const handleJobClick = (jobId: string) => {
    setSelectedJobId(jobId);
  };

  // 모달 닫기 핸들러
  const handleCloseModal = () => {
    setSelectedJobId(null);
  };

  // 선택된 채용 공고 찾기 및 JobItemProps로 변환
  const selectedJob = recommendJobs.find(
    (job) => job.id.toString() === selectedJobId
  );
  const selectedJobItemProps = selectedJob
    ? {
        id: selectedJob.id.toString(),
        title: selectedJob.title,
        companyName: selectedJob.companyName,
        companyId: selectedJob.companyId,
        regions: selectedJob.regions,
        industries: selectedJob.industries,
        jobCategories: selectedJob.jobCategories,
        workType: selectedJob.workType,
        educationLevel: selectedJob.educationLevel,
        openingDate: selectedJob.openingDate,
        expirationDate: selectedJob.expirationDate,
      }
    : null;

  // 통계 데이터를 StatsCardData 형태로 변환
  const statsCardData: StatsCardData[] = [
    {
      title: "진행중인 지원",
      type: "stats" as const,
      value: stats.applicationCount,
      icon: "🏢",
      color: "text-blue-600",
    },
    {
      title: "관심 기업",
      type: "stats" as const,
      value: stats.favoriteCompanyCount,
      icon: "❤️",
      color: "text-green-600",
    },
    {
      title: "등록한 프로젝트",
      type: "stats" as const,
      value: stats.projectCount,
      icon: "📁",
      color: "text-purple-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* 통계 카드 섹션 */}
      <div>
        {statsLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-6 bg-white rounded-lg shadow-sm animate-pulse"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-gray-300 rounded"></div>
                  <div className="flex-1">
                    <div className="w-20 h-4 mb-2 bg-gray-300 rounded"></div>
                    <div className="w-8 h-6 bg-gray-300 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : statsError ? (
          <div className="p-6 text-center bg-white rounded-lg shadow-sm">
            <div className="mb-4 text-4xl text-red-500">📊</div>
            <p className="font-medium text-red-600">{statsError}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 mt-4 text-sm text-white bg-red-500 rounded-lg hover:bg-red-600"
            >
              다시 시도
            </button>
          </div>
        ) : (
          <StatsCards stats={statsCardData} />
        )}
      </div>

      {/* 내 문서 섹션 */}
      <div>
        {isLoading ? (
          <div className="p-6 text-center bg-white rounded-lg">
            <div className="w-8 h-8 mx-auto mb-4 border-b-2 border-blue-600 rounded-full animate-spin"></div>
            <p className="text-gray-600">문서 로딩 중...</p>
          </div>
        ) : documentsError ? (
          <div className="p-6 text-center bg-white rounded-lg">
            <div className="mb-4 text-4xl text-red-500">⚠️</div>
            <p className="font-medium text-red-600">{documentsError}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 mt-4 text-sm text-white bg-red-500 rounded-lg hover:bg-red-600"
            >
              다시 시도
            </button>
          </div>
        ) : (
          <MyDocuments
            coverLetters={coverLetters}
            portfolios={portfolios}
            refetchCoverLetters={refetchCoverLetters}
            refetchPortfolios={refetchPortfolios} // 추가: 포트폴리오 리페치 함수 전달
          />
        )}
      </div>

      {/* 추천 채용 정보 섹션 */}
      {features.recommendations && <div>
        {jobsLoading ? (
          <div className="p-6 text-center bg-white rounded-lg">
            <div className="w-8 h-8 mx-auto mb-4 border-b-2 border-blue-600 rounded-full animate-spin"></div>
            <p className="text-gray-600">추천 채용 정보 로딩 중...</p>
          </div>
        ) : jobsError ? (
          <div className="p-6 text-center bg-white rounded-lg">
            <div className="mb-4 text-4xl text-red-500">⚠️</div>
            <p className="font-medium text-red-600">{jobsError}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 mt-4 text-sm text-white bg-red-500 rounded-lg hover:bg-red-600"
            >
              다시 시도
            </button>
          </div>
        ) : (
          <RecommendedJobs jobs={recommendJobs} onJobClick={handleJobClick} />
        )}
      </div>}

      {/* 추천 뉴스 섹션 */}
      {features.recommendations && <div>
        {newsLoading ? (
          <div className="p-6 text-center bg-white rounded-lg">
            <div className="w-8 h-8 mx-auto mb-4 border-b-2 border-green-600 rounded-full animate-spin"></div>
            <p className="text-gray-600">추천 뉴스 로딩 중...</p>
          </div>
        ) : newsError ? (
          <div className="p-6 text-center bg-white rounded-lg">
            <div className="mb-4 text-4xl text-red-500">⚠️</div>
            <p className="font-medium text-red-600">{newsError}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 mt-4 text-sm text-white bg-red-500 rounded-lg hover:bg-red-600"
            >
              다시 시도
            </button>
          </div>
        ) : (
          <RecommendedNews newsData={recommendNews} />
        )}
      </div>}

      {/* 채용 공고 상세 모달 */}
      {selectedJobItemProps && (
        <JobDetailModal job={selectedJobItemProps} onClose={handleCloseModal} />
      )}
    </div>
  );
};

export default DashboardPage;
