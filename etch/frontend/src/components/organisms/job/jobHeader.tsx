import { experienceText } from "../../../config/experienceText";
import JobViewToggle from "../../molecules/job/jobViewToggle";
import JobFilterButton from "../../molecules/job/jobFilterButton";

interface JobHeaderProps {
  currentView: "list" | "calendar";
  onViewChange: (view: "list" | "calendar") => void;
  onFilterClick: () => void;
}

export default function JobHeader({
  currentView,
  onViewChange,
  onFilterClick,
}: JobHeaderProps) {
  return (
    <div className="p-6 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between">
        {/* 왼쪽: 제목과 설명 */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
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
                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">채용공고</h1>
            <p className="text-sm text-gray-600">IT 분야의 최신 채용 정보</p>
          </div>
        </div>

        {/* 오른쪽: 컨트롤 버튼들 */}
        <div className="flex items-center gap-2">
          <JobViewToggle
            currentView={currentView}
            onViewChange={onViewChange}
          />
          <JobFilterButton onClick={onFilterClick} />
        </div>
      </div>

      {/* 하단 정보 */}
      <div className="pt-4 mt-4 border-t border-gray-100">
        <div className="flex items-center space-x-6 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{experienceText.jobUpdates}</span>
          </div>
          <div className="flex items-center space-x-2">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"
              />
            </svg>
            <span>관심 공고 저장 가능</span>
          </div>
        </div>
      </div>
    </div>
  );
}
