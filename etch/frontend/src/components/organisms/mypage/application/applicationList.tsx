import ApplicationItem from "../../../molecules/mypage/applicationItem";
import type { ApplicationItemProps } from "../../../atoms/listItem";

interface ApplicationListProps {
  applications: ApplicationItemProps[];
  onStatusChange?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClick?: (id: string) => void;
}

const ApplicationList = ({
  applications,
  onStatusChange,
  onDelete,
  onClick,
}: ApplicationListProps) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold">지원 현황</h3>
        <p className="text-sm text-gray-500">
          현재 지원한 채용 공고의 진행 상황을 확인하고 업데이트하세요
        </p>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {applications.length > 0 ? (
            applications.map((application) => (
              <ApplicationItem
                key={application.id}
                {...application}
                onClick={onClick}
                onStatusChange={onStatusChange}
                onDelete={onDelete}
              />
            ))
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <p className="text-gray-500 text-sm font-medium">
                지원한 공고가 없습니다
              </p>
              <p className="text-gray-400 text-xs mt-1">
                관심있는 채용공고에 지원해보세요
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicationList;
