import type { ButtonProps } from "../../atoms/button";

export default function ChatFileButton({ onClick }: ButtonProps) {
  return (
    <button 
      onClick={onClick}
      className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-full transition-colors cursor-pointer"
    >
      📎
    </button>
  );
}