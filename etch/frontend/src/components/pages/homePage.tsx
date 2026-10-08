import { DEMO_MODE } from "../../config/demo";
import DemoHomePage from "./demoHomePage";
import { Link } from "react-router";
import { funcData } from "../../types/funcComponentData";
import HomeFuncComponent from "../organisms/home/homeFuncComponent";
import ExpiringJobsCarousel from "../organisms/job/expiringJobsCarousel";
import JobDetailModal from "../organisms/job/jobDetailModal";
import HomeNewsCard from "../organisms/home/homeNewsCard";
import HomeProjectCard from "../organisms/home/homeProjectCard";
import ProjectSVG from "../svg/projectSVG";
import SeeMore from "../svg/seeMore";
import { LatestNewsData } from "../../api/newsApi";
import { useEffect, useState } from "react";
import { useExpiringJobs } from "../../hooks/useExpiringJobs";
import type { News } from "../../types/newsTypes";
import useUserStore from "../../store/userStore";

// Landing 이미지들 import
import landing1 from "../../assets/landing/landing1.webp";
import landing2 from "../../assets/landing/landing2.webp";
import landing3 from "../../assets/landing/landing3.webp";
import landing4 from "../../assets/landing/landing4.webp";
import landing5 from "../../assets/landing/landing5.webp";

function HomePage() {
  if (DEMO_MODE) return <DemoHomePage />;
  return <OriginalHomePage />;
}

function OriginalHomePage() {
  const [latestNewsData, setLatestNewsData] = useState<News[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { isLoggedIn } = useUserStore();

  // 마감 임박 채용공고 데이터
  const { jobs: expiringJobs, loading: jobsLoading } = useExpiringJobs();

  // 랜딩 이미지 배열
  const landingImages = [landing1, landing2, landing3, landing4, landing5];

  useEffect(() => {
    const loadLatestNews = async () => {
      const data = await LatestNewsData();
      setLatestNewsData(data);
    };

    loadLatestNews();
  }, []);

  // 이미지 자동 슬라이드 효과
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex(
        (prevIndex) => (prevIndex + 1) % landingImages.length
      );
    }, 4000); // 4초마다 변경

    return () => clearInterval(timer);
  }, [landingImages.length]);

  const handleJobClick = (jobId: string) => {
    setSelectedJobId(jobId);
  };

  const handleCloseModal = () => {
    setSelectedJobId(null);
  };

  const selectedJob = expiringJobs.find((job) => job.id === selectedJobId);
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative w-full h-screen max-h-[900px] min-h-[600px] overflow-hidden bg-gradient-to-br from-[#007DFC] via-[#0066DD] to-[#0056CC] -mt-16 pt-16 md:-mt-16 md:pt-16">
        {/* 동적 배경 패턴 */}
        <div className="absolute inset-0">
          {/* 애니메이션 원들 */}
          <div className="absolute rounded-full w-72 h-72 bg-white/5 -top-36 -left-36 animate-pulse"></div>
          <div
            className="absolute rounded-full w-96 h-96 bg-white/3 top-1/4 -right-48 animate-bounce"
            style={{ animationDuration: "6s" }}
          ></div>
          <div
            className="absolute w-48 h-48 rounded-full bg-white/7 bottom-1/4 left-1/4 animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>

          {/* 그라데이션 오버레이 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 mx-auto max-w-7xl lg:flex-row lg:gap-12">
          {/* 왼쪽: 텍스트 콘텐츠 */}
          <div className="flex-1 text-center lg:text-left">
            <h1 className="mb-6 font-bold leading-tight text-white">
              <span className="block mb-2 text-2xl sm:text-3xl lg:text-4xl xl:text-5xl">
                IT 취업의 모든 것
              </span>
              <span className="block mb-2 text-3xl text-white sm:text-4xl lg:text-5xl xl:text-6xl">
                ETCH
              </span>
              <span className="block text-2xl sm:text-3xl lg:text-4xl xl:text-5xl">
                에서 시작하세요
              </span>
            </h1>

            <p className="mb-8 text-lg leading-relaxed text-blue-100 sm:text-xl lg:text-2xl">
              채용 정보부터 기업 분석, 포트폴리오 작성까지
              <br className="hidden sm:block" />
              <span className="font-semibold text-white">
                IT 취업 준비를 위한 모든 것
              </span>
              을 한 곳에서
            </p>

            <div className="flex flex-col justify-center gap-4 mb-16 sm:flex-row lg:justify-start">
              <Link to={isLoggedIn ? "/mypage" : "/join"} className="group">
                <button className="relative overflow-hidden bg-white text-[#007DFC] px-8 py-3 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all duration-300 shadow-2xl hover:shadow-3xl hover:-translate-y-1 transform">
                  <span className="relative z-10">지금 시작하기</span>
                  <div className="absolute inset-0 transition-opacity duration-300 opacity-0 bg-gradient-to-r from-blue-400 to-blue-600 group-hover:opacity-10"></div>
                </button>
              </Link>
              <Link to={"/jobs"} className="group">
                <button className="px-8 py-3 text-lg font-semibold text-white transition-all duration-300 transform border-2 border-white/30 rounded-xl backdrop-blur-sm hover:bg-white/10 hover:border-white/50 hover:-translate-y-1">
                  채용정보 보기
                </button>
              </Link>
            </div>
          </div>

          {/* 오른쪽: 이미지 캐로셀 */}
          <div className="flex-1 max-w-lg mt-8 lg:mt-0">
            <div className="relative">
              {/* 메인 이미지 컨테이너 */}
              <div className="relative w-full h-80 lg:h-96 xl:h-[450px] rounded-2xl overflow-hidden shadow-2xl group">
                {landingImages.map((image, index) => (
                  <div
                    key={index}
                    className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                      index === currentImageIndex
                        ? "opacity-100 scale-100"
                        : "opacity-0 scale-110"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`ETCH 플랫폼 소개 ${index + 1}`}
                      className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
                      loading={index === 0 ? "eager" : "lazy"}
                      fetchPriority={index === 0 ? "high" : "auto"}
                      decoding="async"
                      width={600}
                      height={450}
                      style={{ aspectRatio: '4/3', minHeight: '450px' }}
                    />
                  </div>
                ))}

                {/* 이미지 오버레이 */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 스크롤 인디케이터 */}
        <div className="absolute transform -translate-x-1/2 bottom-8 left-1/2 animate-bounce">
          <div className="flex flex-col items-center text-white/60">
            <span className="mb-2 text-sm">아래로 스크롤</span>
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </div>
        </div>
      </section>

      <div className="mt-8 space-y-8 sm:mt-12 sm:space-y-12">
        {/* 채용 정보 */}
        <section className="px-6 py-8 bg-white shadow-sm rounded-lg sm:py-10">
          <div className="flex items-center mb-6 space-x-3">
            <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-xl">
              <svg
                className="w-5 h-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              마감 임박 채용
            </h2>
            <div className="flex-1"></div>
            <Link to={"/jobs"}>
              <SeeMore />
            </Link>
          </div>
          <ExpiringJobsCarousel
            jobs={expiringJobs}
            onJobClick={handleJobClick}
            loading={jobsLoading}
          />
        </section>

        {/* 프로젝트 + 뉴스 그리드 */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* 인기 프로젝트 카드 - 2/3 너비 */}
          <section className="xl:col-span-2 px-6 py-8 bg-white shadow-sm rounded-lg sm:py-10">
            <div className="flex flex-col mb-6 space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-xl">
                  <ProjectSVG />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                  인기 프로젝트
                </h2>
              </div>
              <Link to={"/projects"}>
                <SeeMore />
              </Link>
            </div>
            <HomeProjectCard />
          </section>

          {/* 뉴스 카드 - 1/3 너비 */}
          <section className="xl:col-span-1 px-6 py-8 bg-white shadow-sm rounded-lg sm:py-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-xl">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                  뉴스
                </h2>
              </div>
              <Link to={"/news"}>
                <SeeMore />
              </Link>
            </div>
            <HomeNewsCard newsData={latestNewsData} />
          </section>
        </div>

        {/* 주요 기능 소개 */}
        <section className="px-6 py-12 bg-white shadow-sm rounded-lg sm:py-16">
          <div className="mb-8 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl">
              ETCH의 주요 기능
            </h2>
            <p className="max-w-2xl mx-auto text-lg leading-relaxed text-gray-600">
              IT 취업 성공을 위한 모든 도구와 정보를 하나의 플랫폼에서
              만나보세요
            </p>
          </div>
          <HomeFuncComponent funcData={funcData} />
        </section>
      </div>

      {/* 모달 */}
      {selectedJob && (
        <JobDetailModal job={selectedJob} onClose={handleCloseModal} />
      )}
    </div>
  );
}

export default HomePage;
