import DeadlineItem from "../../../molecules/mypage/deadlineItem";
import type { DeadlineItemProps } from "../../../atoms/listItem";

interface UpcomingDeadlinesProps {
  deadlines: DeadlineItemProps[];
  onClick?: (id: string) => void;
}

const UpcomingDeadlines = ({ deadlines, onClick }: UpcomingDeadlinesProps) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-red-600">⚠️</span>
            <h3 className="text-lg font-semibold text-red-600">
              다가오는 마감일
            </h3>
          </div>
          <span className="text-sm text-gray-500">
            {deadlines.length}개의 임박한 마감일
          </span>
        </div>
      </div>
      <div className="p-6">
        {deadlines.length > 0 ? (
          <div className="space-y-3">
            {deadlines.map((deadline) => (
              <DeadlineItem key={deadline.id} {...deadline} onClick={onClick} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-3">📅</div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              임박한 마감일이 없습니다
            </h4>
            <p className="text-gray-600 text-sm">
              7일 이내 마감일이 있는 지원 공고가 없습니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpcomingDeadlines;
