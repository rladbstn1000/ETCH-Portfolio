import { useDialogFocus } from "../../../hooks/useDialogFocus";
import { useState, useEffect } from "react";

export interface JobFilters {
  regions: string[];
  industries: string[];
  jobCategories: string[];
  workTypes: string[];
  educationLevels: string[];
}

interface JobFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: JobFilters) => void;
  onReset: () => void;
  initialFilters: JobFilters;
  options?: Partial<JobFilters>;
}

// 필터 옵션들 (실제로는 API에서 가져오거나 상수로 관리)
const FILTER_OPTIONS = {
  regions: [
    "서울",
    "경기",
    "광주",
    "대구",
    "대전",
    "부산",
    "울산",
    "인천",
    "강원",
    "경남",
    "경북",
    "전남",
    "전북",
    "충북",
    "충남",
    "제주",
    "전국",
    "세종",
  ],
  industries: [
    "서비스업",
    "제조,화학",
    "IT,웹,통신",
    "은행,금융업",
    "미디어,디자인",
    "교육업",
    "의료,제약,복지",
    "판매,유통",
    "건설업",
    "기관,협회",
  ],
  jobCategories: [
    "프론트엔드",
    "백엔드",
    "모바일",
    "데이터/AI",
    "게임/그래픽",
    "보안/인프라",
    "DevOps/클라우드",
    "임베디드/하드웨어",
    "기타/공통",
  ],
  workTypes: [
    "정규직",
    "계약직",
    "병역특례",
    "인턴직",
    "아르바이트",
    "파견직",
    "해외취업",
    "위촉직",
    "프리랜서",
    "계약직 (정규직 전환가능)",
    "인턴직 (정규직 전환가능)",
    "교육생",
    "별정직",
    "파트",
    "전임",
    "기간제",
    "무기계약직",
    "전문계약직",
    "전문연구요원",
    "산업기능요원",
    "현역",
    "보충역",
  ],
  educationLevels: [
    "학력무관",
    "고등학교졸업",
    "대학졸업(2,3년)",
    "대학교졸업(4년)",
    "석사졸업",
    "박사졸업",
    "고등학교졸업이상",
    "대학졸업(2,3년)이상",
    "대학교졸업(4년)이상",
    "석사졸업이상",
  ],
};

export default function JobFilterModal({
  isOpen,
  onClose,
  onApply,
  onReset,
  initialFilters,
  options,
}: JobFilterModalProps) {
  const availableOptions = { ...FILTER_OPTIONS, ...options };
  const dialog = useDialogFocus(onClose, isOpen);
  const [filters, setFilters] = useState<JobFilters>(initialFilters);

  // 모달이 열릴 때마다 초기 필터로 리셋
  useEffect(() => {
    if (isOpen) {
      setFilters(initialFilters);
    }
  }, [isOpen, initialFilters]);

  // 모달 열림/닫힘에 따른 body 스크롤 제어
  useEffect(() => {
    if (isOpen) {
      // 모달이 열릴 때 body 스크롤 막기
      document.body.style.overflow = "hidden";
      // 현재 스크롤 위치 저장
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
    } else {
      // 모달이 닫힐 때 원래대로 복구
      document.body.style.overflow = "unset";
      document.body.style.position = "static";
    }

    // 컴포넌트 언마운트 시 cleanup
    return () => {
      document.body.style.overflow = "unset";
      document.body.style.position = "static";
      document.body.style.width = "auto";
    };
  }, [isOpen]);

  // 필터 토글 함수
  const toggleFilter = (category: keyof JobFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter((item) => item !== value)
        : [...prev[category], value],
    }));
  };

  // 전체 선택/해제 함수
  const toggleAll = (category: keyof JobFilters) => {
    const allOptions = availableOptions[category];
    const isAllSelected = allOptions.every((option) =>
      filters[category].includes(option)
    );

    setFilters((prev) => ({
      ...prev,
      [category]: isAllSelected ? [] : [...allOptions],
    }));
  };

  // 필터 적용
  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  // 필터 초기화
  const handleReset = () => {
    const emptyFilters: JobFilters = {
      regions: [],
      industries: [],
      jobCategories: [],
      workTypes: [],
      educationLevels: [],
    };
    setFilters(emptyFilters);
    onReset(); // 부모 컴포넌트의 onReset 함수도 호출
  };

  if (!isOpen) return null;

  // 카테고리별 아이콘 매핑
  const getCategoryIcon = (category: keyof JobFilters) => {
    const icons = {
      regions: "📍",
      industries: "🏢",
      jobCategories: "💻",
      workTypes: "👔",
      educationLevels: "🎓",
    };
    return icons[category];
  };

  // 필터 섹션 렌더링 컴포넌트
  const FilterSection = ({
    title,
    category,
    options,
  }: {
    title: string;
    category: keyof JobFilters;
    options: string[];
  }) => {
    const selectedCount = filters[category].length;

    return (
      <div className="p-6 mb-8 bg-white border border-gray-200 rounded-sm shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <span className="text-xl">{getCategoryIcon(category)}</span>
            <h4 className="text-lg font-bold text-gray-900">{title}</h4>
            {selectedCount > 0 && (
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-sm">
                {selectedCount}개 선택됨
              </span>
            )}
          </div>
          <button
            onClick={() => toggleAll(category)}
            className="px-3 py-2 text-sm font-medium text-blue-600 transition-colors duration-200 rounded-sm bg-blue-50 hover:bg-blue-100 hover:text-blue-700"
          >
            {options.every((option) => filters[category].includes(option))
              ? "전체 해제"
              : "전체 선택"}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {options.map((option) => {
            const isSelected = filters[category].includes(option);
            return (
              <label
                key={option}
                className={`flex items-center p-3 cursor-pointer transition-all duration-200 border rounded-sm ${
                  isSelected
                    ? "bg-blue-600 border-blue-600 text-white shadow-md"
                    : "bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleFilter(category, option)}
                  className="sr-only"
                />
                <div
                  className={`flex items-center justify-center w-4 h-4 border mr-3 ${
                    isSelected
                      ? "bg-white border-white"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  {isSelected && (
                    <svg
                      className="w-3 h-3 text-blue-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-medium truncate">{option}</span>
              </label>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div ref={dialog} role="dialog" aria-modal="true" aria-label="채용 필터" tabIndex={-1} className="bg-white rounded-sm shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden border border-gray-200">
        {/* 헤더 */}
        <div className="px-8 py-6 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-10 h-10 text-white bg-blue-600 rounded-sm">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  채용공고 필터
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  원하는 조건으로 채용공고를 필터링하세요
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 transition-colors duration-200 rounded-sm hover:text-gray-600 hover:bg-gray-100"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* 필터 내용 */}
        <div className="p-8 overflow-y-auto max-h-[60vh] bg-gray-50">
          <FilterSection
            title="지역"
            category="regions"
            options={availableOptions.regions}
          />
          <FilterSection
            title="업종"
            category="industries"
            options={availableOptions.industries}
          />
          <FilterSection
            title="직무"
            category="jobCategories"
            options={availableOptions.jobCategories}
          />
          <FilterSection
            title="고용형태"
            category="workTypes"
            options={availableOptions.workTypes}
          />
          <FilterSection
            title="학력"
            category="educationLevels"
            options={availableOptions.educationLevels}
          />
        </div>

        {/* 하단 버튼 */}
        <div className="px-8 py-6 bg-white border-t border-gray-200">
          <div className="flex items-center justify-between">
            <button
              onClick={handleReset}
              className="flex items-center px-6 py-3 text-sm font-medium text-gray-600 transition-colors duration-200 bg-white border border-gray-300 rounded-sm hover:border-red-400 hover:text-red-600 hover:bg-red-50"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              초기화
            </button>

            <div className="flex space-x-4">
              <button
                onClick={onClose}
                className="px-6 py-3 text-sm font-medium text-gray-600 transition-colors duration-200 bg-white border border-gray-300 rounded-sm hover:border-gray-400 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleApply}
                className="flex items-center px-8 py-3 text-sm font-semibold text-white transition-all duration-200 bg-blue-600 rounded-sm shadow-md hover:bg-blue-700 hover:shadow-lg"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                필터 적용
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
