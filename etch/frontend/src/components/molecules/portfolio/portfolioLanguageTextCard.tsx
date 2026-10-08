import type { language } from "../../../types/portfolio/portfolioDatas";

function PortfolioLanguageTextCard({
  language,
  onRemove,
}: {
  language: language[];
  onRemove?: (index: number) => void;
}) {
  if (language.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
        <p>등록된 자격증이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {language.map((lang, index) => (
        <div
          key={index}
          className="bg-gray-50 border border-gray-200 rounded-md p-3 flex justify-between items-center hover:bg-gray-100 transition-colors"
        >
          <div className="flex-1">
            <div className="font-medium text-gray-900 text-sm mb-1">
              {lang.licenseName}
            </div>
            <div className="text-xs text-gray-600">
              {lang.getAt && `(${lang.getAt})`}
              {lang.issuer && ` | ${lang.issuer}`}
            </div>
          </div>
          {onRemove && (
            <button
              onClick={() => onRemove(index)}
              className="text-red-500 hover:text-red-700 text-lg px-2 py-1 ml-3 transition-colors"
              title="삭제"
            >
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export default PortfolioLanguageTextCard;
