import type { ModalHeaderProps } from "../../atoms/modalTypes";

export default function ChatListHeader({ onClose }: ModalHeaderProps) {
  return (
    <div className="flex justify-between items-center p-4 border-b border-gray-200 rounded-t-lg bg-white">
      <h2 className="text-lg font-semibold text-gray-900">채팅</h2>
      <button 
        onClick={onClose}
        className="text-gray-500 hover:text-gray-700 text-xl"
      >
        ×
      </button>
    </div>
  );
}