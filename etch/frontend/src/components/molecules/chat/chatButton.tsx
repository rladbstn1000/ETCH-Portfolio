import type { ButtonProps } from "../../atoms/button";
import chatIcon from "../../svg/chat.svg";

export default function ChatButton({ onClick }: ButtonProps) {
  return (
    <button
      className="fixed z-50 transition-transform duration-200 cursor-pointer bottom-6 right-6 hover:scale-110"
      onClick={onClick}
    >
      <img src={chatIcon} alt="Chat" className="w-20 h-20" />
    </button>
  );
}
