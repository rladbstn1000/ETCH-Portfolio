import type { InputProps } from "../../atoms/input";

const CoverLetterInfoSection = ({
  value,
  type,
  onChange,
  placeholderText: placeholder = "예: 네이버 백엔드 개발자 지원서",
}: InputProps) => {
  return (
    <div className="mb-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold">자기소개서 정보</h3>
      </div>
      <div className="p-6">
        <div>
          <label
            htmlFor="coverLetterName"
            className="block mb-1 text-sm font-medium text-gray-700"
          >
            자기소개서 제목
          </label>
          <input
            type={type}
            id="coverLetterName"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
};

export default CoverLetterInfoSection;
