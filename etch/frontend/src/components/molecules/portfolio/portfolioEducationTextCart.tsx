import type { education } from "../../../types/portfolio/portfolioDatas";

function PortfolioEducationTextCard({
  education,
  onRemove,
}: {
  education: education[];
  onRemove?: (index: number) => void;
}) {
  if (education.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
        <p>등록된 활동이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {education.map((edu, index) => (
        <div
          key={index}
          className="bg-gray-50 border border-gray-200 rounded-md p-3 flex justify-between items-center hover:bg-gray-100 transition-colors"
        >
          <div className="flex-1">
            <div className="font-medium text-gray-900 text-sm mb-1">
              {edu.companyName}
            </div>
            {edu.active && (
              <div className="text-sm text-gray-700 mb-1">{edu.active}</div>
            )}
            <div className="text-xs text-gray-600">
              {edu.startAt && edu.endAt && `(${edu.startAt} ~ ${edu.endAt})`}
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

export default PortfolioEducationTextCard;
