import type { ChatRoomHeaderProps } from "../../atoms/modalTypes";

export default function ChatRoomHeader({
  roomName,
  onBack,
}: ChatRoomHeaderProps) {
  return (
    <div className="flex justify-between items-center p-4 border-b border-gray-200 rounded-t-lg bg-white">
      <button
        onClick={onBack}
        className="text-gray-600 hover:text-gray-800 text-xl"
      >
        ←
      </button>
      <h2 className="text-lg font-semibold text-gray-900">{roomName}</h2>
      <button className="text-gray-600 hover:text-gray-800 text-xl">⋯</button>
    </div>
  );
}
