import { useState, useMemo } from "react";
import JobHeader from "../../organisms/job/jobHeader";
import JobList from "../../organisms/job/jobList";
import CalendarView from "../../organisms/job/calendarView";
import JobDetailModal from "../../organisms/job/jobDetailModal";
import JobFilterModal, {
  type JobFilters,
} from "../../organisms/job/jobFilterModal";
import { useJobs } from "../../../hooks/useJobs";

export default function JobPage({ initialDate, filterOptions }: { initialDate?: Date; filterOptions?: Partial<JobFilters> } = {}) {

  const [currentView, setCurrentView] = useState<"list" | "calendar">(
    "calendar"
  );
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [currentCalendarDate, setCurrentCalendarDate] = useState<Date>(
    initialDate ?? new Date()
  );
  const [currentDateRange, setCurrentDateRange] = useState<
    { start: Date; end: Date } | undefined
  >(undefined);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // 필터 상태
  const [activeFilters, setActiveFilters] = useState<JobFilters>({
    regions: [],
    industries: [],
    jobCategories: [],
    workTypes: [],
    educationLevels: [],
  });

  // custom hook 사용
  const { jobs: allJobs, loading, error, handleDateRangeChange } = useJobs();

  // 필터링된 채용공고 계산
  const filteredJobs = useMemo(() => {
    return allJobs.filter((job) => {
      // 지역 필터
      if (activeFilters.regions.length > 0) {
        const hasMatchingRegion = job.regions.some((region) =>
          activeFilters.regions.includes(region)
        );
        if (!hasMatchingRegion) return false;
      }

      // 업종 필터
      if (activeFilters.industries.length > 0) {
        const hasMatchingIndustry = job.industries.some((industry) =>
          activeFilters.industries.includes(industry)
        );
        if (!hasMatchingIndustry) return false;
      }

      // 직무 필터
      if (activeFilters.jobCategories.length > 0) {
        const hasMatchingJobCategory = job.jobCategories.some((category) =>
          activeFilters.jobCategories.includes(category)
        );
        if (!hasMatchingJobCategory) return false;
      }

      // 고용형태 필터
      if (activeFilters.workTypes.length > 0) {
        if (!activeFilters.workTypes.includes(job.workType)) return false;
      }

      // 학력 필터
      if (activeFilters.educationLevels.length > 0) {
        if (!activeFilters.educationLevels.includes(job.educationLevel))
          return false;
      }

      return true;
    });
  }, [allJobs, activeFilters]);

  const handleDateRangeChangeWrapper = (startDate: Date, endDate: Date) => {
    setCurrentDateRange({ start: startDate, end: endDate });
    handleDateRangeChange(startDate, endDate);
  };


  const handleViewChange = (view: "list" | "calendar") => {
    setCurrentView(view);
  };

  const handleFilterClick = () => {
    setIsFilterModalOpen(true);
  };

  const handleFilterApply = (newFilters: JobFilters) => {
    setActiveFilters(newFilters);
  };

  const handleFilterReset = () => {
    const emptyFilters: JobFilters = {
      regions: [],
      industries: [],
      jobCategories: [],
      workTypes: [],
      educationLevels: [],
    };
    setActiveFilters(emptyFilters);
  };

  const handleJobClick = (jobId: string) => {
    setSelectedJobId(jobId);
  };

  const handleCloseModal = () => {
    setSelectedJobId(null);
  };

  const selectedJob = filteredJobs.find((job) => job.id === selectedJobId);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div>
      <JobHeader
        currentView={currentView}
        onViewChange={handleViewChange}
        onFilterClick={handleFilterClick}
      />

      <div className="mt-6">
        {currentView === "list" && (
          <JobList
            jobs={filteredJobs}
            onJobClick={handleJobClick}
            dateRange={currentDateRange}
          />
        )}
        {currentView === "calendar" && (
          <CalendarView
            jobList={filteredJobs}
            onEventClick={handleJobClick}
            onDateRangeChange={handleDateRangeChangeWrapper}
            currentDate={currentCalendarDate}
            onDateChange={setCurrentCalendarDate}
          />
        )}
      </div>

      {/* 로딩 중일 때 오버레이 */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="p-8 bg-white rounded-lg shadow-lg">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 mb-4 border-4 border-blue-200 rounded-full border-t-blue-600 animate-spin"></div>
              <div className="text-lg font-medium text-gray-600">
                채용달력을 불러오고 있어요
              </div>
              <div className="mt-2 text-sm text-gray-500">
                잠시만 기다려주세요...
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedJob && (
        <JobDetailModal job={selectedJob} onClose={handleCloseModal} />
      )}

      {/* 필터 모달 */}
      <JobFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApply={handleFilterApply}
        onReset={handleFilterReset}
        initialFilters={activeFilters}
        options={filterOptions}
      />
    </div>
  );
}
