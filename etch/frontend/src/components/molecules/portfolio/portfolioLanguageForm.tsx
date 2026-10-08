import { useState } from "react";
import {
  LicenseState,
  type language,
} from "../../../types/portfolio/portfolioDatas";

function PortfolioLangugaeForm({
  onSubmit,
  initialData,
}: {
  onSubmit: (data: language) => void;
  initialData?: language;
}) {
  const [formData, setFormData] = useState<language>(
    initialData || { ...LicenseState }
  );
  const [dateError, setDateError] = useState<string>("");

  // 날짜 검증 함수 (미래 날짜 체크)
  const validateDate = (selectedDate: string) => {
    if (selectedDate) {
      const selected = new Date(selectedDate);
      const today = new Date();

      // 오늘 날짜를 YYYY-MM-DD 형식으로 변환 (시간 제거)
      today.setHours(0, 0, 0, 0);
      selected.setHours(0, 0, 0, 0);

      if (selected > today) {
        setDateError("취득일은 오늘보다 미래일 수 없습니다.");
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
    if (!validateDate(formData.getAt)) {
      return; // 검증 실패 시 제출하지 않음
    }

    onSubmit(formData);
    // 폼 초기화
    setFormData({ ...LicenseState });
    setDateError("");
  };

  const handleDateChange = (value: string) => {
    setFormData((prev) => ({ ...prev, getAt: value }));
    validateDate(value);
  };

  // 오늘 날짜를 YYYY-MM-DD 형식으로 가져오기
  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mt-4">
      <h3 className="text-base font-semibold text-gray-900 mb-4">
        자격증 정보 입력
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            자격증명
          </label>
          <input
            type="text"
            value={formData.licenseName}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, licenseName: e.target.value }))
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
            placeholder="정보처리기사"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            취득일
            <span className="text-xs text-gray-500 ml-2 font-normal">
              (오늘까지 선택 가능)
            </span>
          </label>
          <input
            type="date"
            value={formData.getAt}
            onChange={(e) => handleDateChange(e.target.value)}
            max={getTodayString()} // HTML5 max 속성으로 미래 날짜 선택 제한
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
            발급기관
          </label>
          <input
            type="text"
            value={formData.issuer}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, issuer: e.target.value }))
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
            placeholder="한국산업인력공단"
            required
          />
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
              setFormData({ ...LicenseState });
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
            자격증 추가
          </button>
        </div>
      </form>
    </div>
  );
}

export default PortfolioLangugaeForm;
