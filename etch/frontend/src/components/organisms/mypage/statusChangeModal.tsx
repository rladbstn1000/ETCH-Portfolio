import { useState, useEffect } from "react";
import { useDialogFocus } from "../../../hooks/useDialogFocus";
import StatusChangeDropdown from "../../molecules/mypage/statusChangeDropdown";
import type { AppliedJobListResponse } from "../../../types/appliedJob";

interface StatusChangeModalProps {
  appliedJob: AppliedJobListResponse;
  statusCodes: Record<string, string>;
  onStatusChange: (appliedJobId: number, newStatus: string) => Promise<void>;
  onClose: () => void;
}

const StatusChangeModal = ({ 
  appliedJob, 
  statusCodes, 
  onStatusChange, 
  onClose 
}: StatusChangeModalProps) => {
  const dialog = useDialogFocus(onClose);
  const [selectedStatus, setSelectedStatus] = useState(appliedJob.status);
  const [isUpdating, setIsUpdating] = useState(false);

  // 모달 열릴 때 body 스크롤 막기
  useEffect(() => {
    document.body.style.overflow = "hidden";
    
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSave = async () => {
    if (selectedStatus === appliedJob.status) {
      onClose();
      return;
    }

    try {
      setIsUpdating(true);
      await onStatusChange(appliedJob.appliedJobId, selectedStatus);
      onClose();
    } catch (error) {
      console.error("상태 변경 실패:", error);
      // 에러 처리는 상위 컴포넌트에서 처리
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return '🕒';
      case 'DOCUMENT_DONE': return '📄';
      case 'DOCUMENT_FAILED': return '❌';
      case 'INTERVIEW_DONE': return '💼';
      case 'INTERVIEW_FAILED': return '❌';
      case 'FINAL_PASSED': return '✅';
      default: return '📋';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30"
      onClick={handleOverlayClick}
    >
      <div ref={dialog} role="dialog" aria-modal="true" aria-label="지원 상태 변경" tabIndex={-1} className="bg-white rounded-xl w-full max-w-md shadow-2xl">
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              지원 상태 변경
            </h2>
            <button
              aria-label="모달 닫기"
              onClick={onClose}
              className="text-2xl text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>

        {/* 컨텐츠 */}
        <div className="p-6">
          {/* 지원 정보 */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">{appliedJob.companyName}</h3>
            <p className="text-sm text-gray-600 mb-1">{appliedJob.title}</p>
            <p className="text-xs text-gray-500">
              지원일: {new Date(appliedJob.openingDate).toLocaleDateString()}
            </p>
          </div>

          {/* 현재 상태 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              현재 상태
            </label>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>{getStatusIcon(appliedJob.status)}</span>
              <span>{statusCodes[appliedJob.status] || appliedJob.status}</span>
            </div>
          </div>

          {/* 새로운 상태 선택 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              변경할 상태
            </label>
            <StatusChangeDropdown
              statusCodes={statusCodes}
              currentStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
            />
          </div>

          {/* 변경 사항 미리보기 */}
          {selectedStatus !== appliedJob.status && (
            <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-blue-600">🔄</span>
                <span className="text-blue-800">
                  "{statusCodes[appliedJob.status]}" → "{statusCodes[selectedStatus]}"로 변경됩니다.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
            disabled={isUpdating}
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={isUpdating || selectedStatus === appliedJob.status}
            className={`px-6 py-2 text-white rounded-lg ${
              isUpdating || selectedStatus === appliedJob.status
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isUpdating ? "변경 중..." : "변경하기"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatusChangeModal;
