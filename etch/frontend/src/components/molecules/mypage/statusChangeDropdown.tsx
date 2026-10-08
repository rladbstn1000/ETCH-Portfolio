import { useState } from "react";

interface StatusChangeDropdownProps {
  statusCodes: Record<string, string>; // 상태 코드와 한국어명 매핑
  currentStatus: string; // 현재 선택된 상태
  onStatusChange: (newStatus: string) => void; // 상태 변경 콜백
}

const StatusChangeDropdown = ({ 
  statusCodes, 
  currentStatus, 
  onStatusChange 
}: StatusChangeDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // 상태 순서 정의
  const statusOrder = [
    'SCHEDULED',        // 예정
    'DOCUMENT_DONE',    // 서류 제출 완료
    'DOCUMENT_FAILED',  // 서류 탈락
    'INTERVIEW_DONE',   // 면접 완료
    'INTERVIEW_FAILED', // 면접 탈락
    'FINAL_PASSED'      // 최종 합격
  ];

  // 정의된 순서대로 상태 코드 정렬
  const sortedStatusCodes = statusOrder
    .filter(status => statusCodes[status]) // 존재하는 상태만 필터링
    .map(status => [status, statusCodes[status]] as [string, string]);

  const handleStatusSelect = (status: string) => {
    onStatusChange(status);
    setIsOpen(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'DOCUMENT_DONE': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'DOCUMENT_FAILED': return 'text-red-700 bg-red-50 border-red-200';
      case 'INTERVIEW_DONE': return 'text-purple-700 bg-purple-50 border-purple-200';
      case 'INTERVIEW_FAILED': return 'text-red-700 bg-red-50 border-red-200';
      case 'FINAL_PASSED': return 'text-green-700 bg-green-50 border-green-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="relative">
      {/* 드롭다운 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 text-left border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${getStatusColor(currentStatus)}`}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {statusCodes[currentStatus] || currentStatus}
          </span>
          <svg
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="py-1">
            {sortedStatusCodes.map(([code, label]) => (
              <button
                key={code}
                onClick={() => handleStatusSelect(code)}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                  code === currentStatus ? 'bg-gray-100 font-medium' : ''
                } ${getStatusColor(code).split(' ')[0]}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 드롭다운 외부 클릭 시 닫기 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default StatusChangeDropdown;