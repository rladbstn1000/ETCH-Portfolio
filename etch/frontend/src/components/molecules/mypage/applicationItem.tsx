import type { ApplicationItemProps } from "../../atoms/listItem";

const ApplicationItem = ({
  id,
  appliedJobId: _appliedJobId,
  jobId: _jobId,
  companyId: _companyId,
  title,
  companyName,
  openingDate,
  closingDate,
  status,
  statusText,
  onClick,
  onStatusChange,
  onDelete,
}: ApplicationItemProps) => {
  const getStatusDotColor = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return "bg-blue-600";
      case "DOCUMENT_DONE":
        return "bg-yellow-600";
      case "DOCUMENT_FAILED":
        return "bg-red-600";
      case "INTERVIEW_DONE":
        return "bg-yellow-600";
      case "INTERVIEW_FAILED":
        return "bg-red-600";
      case "FINAL_PASSED":
        return "bg-green-600";
      default:
        return "bg-gray-600";
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return "bg-blue-100 text-blue-800";
      case "DOCUMENT_DONE":
        return "bg-yellow-100 text-yellow-800";
      case "DOCUMENT_FAILED":
        return "bg-red-100 text-red-800";
      case "INTERVIEW_DONE":
        return "bg-yellow-100 text-yellow-800";
      case "INTERVIEW_FAILED":
        return "bg-red-100 text-red-800";
      case "FINAL_PASSED":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div
      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
      onClick={() => onClick?.(id)}
    >
      <div className="flex items-center gap-4">
        <div
          className={`w-3 h-3 rounded-full ${getStatusDotColor(status)}`}
        ></div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium">{companyName}</h4>
            <span
              className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(
                status
              )}`}
            >
              {statusText}
            </span>
          </div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-xs text-gray-500">
            지원: {new Date(openingDate).toLocaleDateString()}
          </p>
          <p className="text-xs text-gray-500">
            마감: {new Date(closingDate).toLocaleDateString()}
          </p>
        </div>
      </div>
      <div className="flex space-x-2">
        <button
          className="px-3 py-1 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
          onClick={(e) => {
            e.stopPropagation();
            onStatusChange?.(id);
          }}
        >
          상태 변경
        </button>
        <button
          className="px-3 py-1 text-sm text-white bg-red-600 rounded-md hover:bg-red-700"
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.(id);
          }}
        >
          삭제
        </button>
      </div>
    </div>
  );
};

export default ApplicationItem;
