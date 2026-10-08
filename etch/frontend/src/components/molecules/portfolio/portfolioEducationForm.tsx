import { useState } from "react";
import {
  ActivityState,
  type education,
} from "../../../types/portfolio/portfolioDatas";

function PortfolioEducationForm({
  onSubmit,
  initialData,
}: {
  onSubmit: (data: education) => void;
  initialData?: education;
}) {
  const [formData, setFormData] = useState<education>(
    initialData || { ...ActivityState }
  );
  const [dateError, setDateError] = useState<string>("");

  // 오늘 날짜를 YYYY-MM-DD 형식으로 가져오기
  const today = new Date().toISOString().split("T")[0];

  // 날짜 검증 함수
  const validateDates = (startDate: string, endDate: string) => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (end < start) {
        setDateError("종료일은 시작일보다 늦어야 합니다.");
        return false;
      } else {
        setDateError("");
        return true;
      }
    }
    setDateError("");
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 제출 전 최종 날짜 검증
    if (!validateDates(formData.startAt, formData.endAt)) {
      return; // 검증 실패 시 제출하지 않음
    }

    onSubmit(formData);
    // 폼 초기화
    setFormData({ ...ActivityState });
    setDateError("");
  };

  const handleStartDateChange = (value: string) => {
    setFormData((prev) => ({ ...prev, startAt: value }));
    validateDates(value, formData.endAt);
  };

  const handleEndDateChange = (value: string) => {
    setFormData((prev) => ({ ...prev, endAt: value }));
    validateDates(formData.startAt, value);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mt-4">
      <h3 className="text-base font-semibold text-gray-900 mb-4">
        활동 정보 입력
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            기관/회사명
          </label>
          <input
            type="text"
            value={formData.companyName}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, companyName: e.target.value }))
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
            placeholder="삼성전자"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            활동명/설명
          </label>
          <input
            type="text"
            value={formData.active}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, active: e.target.value }))
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
            placeholder="인턴십, 교육과정명 등"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              시작일
            </label>
            <input
              type="date"
              value={formData.startAt}
              onChange={(e) => handleStartDateChange(e.target.value)}
              max={today}
              className={`w-full px-4 py-3 border rounded-md transition-colors bg-white focus:ring-2 focus:ring-blue-500 ${
                dateError
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:border-blue-500"
              }`}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              종료일
            </label>
            <input
              type="date"
              value={formData.endAt}
              onChange={(e) => handleEndDateChange(e.target.value)}
              max={today}
              className={`w-full px-4 py-3 border rounded-md transition-colors bg-white focus:ring-2 focus:ring-blue-500 ${
                dateError
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:border-blue-500"
              }`}
              required
            />
          </div>
        </div>

        {/* 에러 메시지 표시 */}
        {dateError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            <span className="font-medium">⚠️ {dateError}</span>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              setFormData({ ...ActivityState });
              setDateError("");
            }}
            className="flex-1 px-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={!!dateError} // 에러가 있으면 버튼 비활성화
            className={`flex-1 px-4 py-3 rounded-md font-medium transition-colors ${
              dateError
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            활동 추가
          </button>
        </div>
      </form>
    </div>
  );
}

export default PortfolioEducationForm;
