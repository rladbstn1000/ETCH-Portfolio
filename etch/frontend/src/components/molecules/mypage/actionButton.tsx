import type { ButtonProps } from "../../atoms/button";

const ActionButton = ({ text, onClick, bgColor, textColor, disabled = false }: ButtonProps) => {
  return (
    <button
      className={`w-full px-4 py-2 rounded-md text-sm ${
        bgColor || "bg-gray-100"
      } ${textColor || "text-black"} ${
        disabled 
          ? "cursor-not-allowed opacity-60" 
          : "hover:opacity-80 cursor-pointer"
      }`}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      title={disabled ? "팔로우 후 채팅 가능" : ""}
    >
      {text}
    </button>
  );
};

export default ActionButton;
