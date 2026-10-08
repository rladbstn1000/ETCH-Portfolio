import type { TextCard } from "../../atoms/textCard";
import PortfolioLangugaeForm from "../../molecules/portfolio/portfolioLanguageForm";
import PortfolioLanguageTextCard from "../../molecules/portfolio/portfolioLanguageTextCard";
import PortfolioEducationTextCard from "../../molecules/portfolio/portfolioEducationTextCart";
import type {
  education,
  language,
} from "../../../types/portfolio/portfolioDatas";
import PortfolioEducationForm from "../../molecules/portfolio/portfolioEducationForm";

function PortfolioWriteTextCard({
  title,
  type,
  education,
  language,
  onEducationAdd,
  onLanguageAdd,
  onEducationRemove: onActivityRemove,
  onLanguageRemove: onLicenseRemove,
  showForm,
  onToggleForm,
}: TextCard & {
  education?: education[];
  language?: language[];
  onEducationAdd?: (education: string) => void;
  onLanguageAdd?: (language: string) => void;
  onEducationRemove?: (index: number) => void;
  onLanguageRemove?: (index: number) => void;
  showForm?: boolean;
  onToggleForm?: () => void;
}) {
  // 객체를 문자열로 변환하는 핸들러들
  const handleEducationSubmit = (data: education) => {
    if (onEducationAdd) {
      const educationString = `${data.companyName}^${data.active}^${data.startAt}^${data.endAt}`;
      onEducationAdd(educationString);
    }
  };

  const handleLanguageSubmit = (data: language) => {
    if (onLanguageAdd) {
      const languageString = `${data.licenseName}^${data.getAt}^${data.issuer}`;
      onLanguageAdd(languageString);
    }
  };

  const renderContent = () => {
    switch (type) {
      case "education":
        return (
          <div className="space-y-4">
            {/* 기존 교육/활동 목록 표시 */}
            <PortfolioEducationTextCard
              education={education || []}
              onRemove={onActivityRemove}
            />

            {/* 폼이 열려있을 때만 표시 */}
            {showForm && (
              <PortfolioEducationForm onSubmit={handleEducationSubmit} />
            )}
          </div>
        );
      case "language":
        return (
          <div className="space-y-4">
            {/* 기존 자격증 목록 표시 */}
            <PortfolioLanguageTextCard
              language={language || []}
              onRemove={onLicenseRemove}
            />

            {/* 폼이 열려있을 때만 표시 */}
            {showForm && (
              <PortfolioLangugaeForm onSubmit={handleLanguageSubmit} />
            )}
          </div>
        );
      default:
        return <div className="text-red-500">잘못된 타입입니다.</div>;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      {/* 제목과 추가 버튼이 있는 헤더 */}
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <button
          onClick={() => onToggleForm?.()}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            showForm
              ? "bg-gray-500 text-white hover:bg-gray-600"
              : "bg-gray-900 text-white hover:bg-gray-800"
          }`}
        >
          {showForm ? "폼 닫기" : "+ 추가"}
        </button>
      </div>

      {/* 구분선 */}
      <div className="border-b border-gray-200 mb-5"></div>

      {/* 컨텐츠 영역 */}
      {renderContent()}
    </div>
  );
}

export default PortfolioWriteTextCard;
