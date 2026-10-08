import type { ButtonProps } from "../../atoms/button";

export default function ChatSendButton({ onClick }: ButtonProps) {
  return (
    <button 
      onClick={onClick}
      className="bg-black text-white px-4 py-2 rounded-full hover:bg-gray-800 transition-colors cursor-pointer"
    >
      전송
    </button>
  );
}