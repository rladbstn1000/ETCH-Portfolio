import { useRef, useState, useEffect } from "react";
import JobListItem from "../../molecules/job/jobListItem";
import type { JobItemProps } from "../../atoms/listItem";
import { useLikedJobs } from "../../../hooks/useLikedItems";

interface ExpiringJobsCarouselProps {
  jobs: JobItemProps[];
  onJobClick?: (jobId: string) => void;
  loading?: boolean;
}

export default function ExpiringJobsCarousel({ 
  jobs, 
  onJobClick, 
  loading = false 
}: ExpiringJobsCarouselProps) {
  const { isJobLiked, addLikedJob, removeLikedJob } = useLikedJobs();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardWidth, setCardWidth] = useState(0);

  // 카드 너비 계산 (컨테이너에서 3개가 딱 들어가도록)
  useEffect(() => {
    const updateCardWidth = () => {
      if (scrollRef.current) {
        const containerWidth = scrollRef.current.offsetWidth;
        const gap = 16; // gap-4 = 16px
        const calculatedWidth = (containerWidth - (gap * 2)) / 3;
        setCardWidth(calculatedWidth);
      }
    };

    updateCardWidth();
    window.addEventListener('resize', updateCardWidth);
    return () => window.removeEventListener('resize', updateCardWidth);
  }, []);

  // 4초마다 자동 슬라이드
  useEffect(() => {
    if (jobs.length <= 3) return;

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = prevIndex >= jobs.length - 3 ? 0 : prevIndex + 1;
        
        if (scrollRef.current) {
          // 실시간으로 컨테이너 너비 계산
          const containerWidth = scrollRef.current.offsetWidth;
          const gap = 16;
          const currentCardWidth = (containerWidth - (gap * 2)) / 3;
          const scrollAmount = (currentCardWidth + gap) * nextIndex;
          scrollRef.current.scrollTo({ left: scrollAmount, behavior: 'smooth' });
        }
        
        return nextIndex;
      });
    }, 4000);

    return () => clearInterval(timer);
  }, [jobs.length]);

  const handleLikeStateChange = (jobId: number, isLiked: boolean) => {
    if (isLiked) {
      addLikedJob(jobId);
    } else {
      removeLikedJob(jobId);
    }
  };

  const scrollLeft = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      if (scrollRef.current) {
        const containerWidth = scrollRef.current.offsetWidth;
        const gap = 16;
        const currentCardWidth = (containerWidth - (gap * 2)) / 3;
        const scrollAmount = (currentCardWidth + gap) * newIndex;
        scrollRef.current.scrollTo({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  };

  const scrollRight = () => {
    if (currentIndex < jobs.length - 3) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      if (scrollRef.current) {
        const containerWidth = scrollRef.current.offsetWidth;
        const gap = 16;
        const currentCardWidth = (containerWidth - (gap * 2)) / 3;
        const scrollAmount = (currentCardWidth + gap) * newIndex;
        scrollRef.current.scrollTo({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  };

  // 로딩 스켈레톤 UI
  if (loading) {
    return (
      <div className="relative">
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className="h-48 bg-gray-200 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  // 데이터가 없을 때
  if (!jobs || jobs.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-500 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="mb-2 text-2xl">📅</div>
          <div className="text-sm">마감 임박한 채용공고가 없습니다</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative px-12">
      {/* 좌측 네비게이션 버튼 */}
      {jobs.length > 3 && currentIndex > 0 && (
        <button
          onClick={scrollLeft}
          className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white border border-gray-300 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center hover:bg-blue-50 hover:border-blue-300"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* 캐러셀 컨테이너 */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-hidden"
      >
        {jobs.map((job) => (
          <div 
            key={job.id} 
            className="flex-shrink-0 transition-all duration-300"
            style={{ width: cardWidth > 0 ? `${cardWidth}px` : 'calc(33.333% - 10.67px)' }}
          >
            <JobListItem 
              {...job} 
              onClick={onJobClick} 
              isLiked={isJobLiked(Number(job.id))}
              onLikeStateChange={handleLikeStateChange}
            />
          </div>
        ))}
      </div>

      {/* 우측 네비게이션 버튼 */}
      {jobs.length > 3 && currentIndex < jobs.length - 3 && (
        <button
          onClick={scrollRight}
          className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white border border-gray-300 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center hover:bg-blue-50 hover:border-blue-300"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </div>
  );
}