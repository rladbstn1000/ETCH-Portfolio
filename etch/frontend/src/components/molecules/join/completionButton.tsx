import type { AdditionalButtonProps } from "../../atoms/button";

function CompletionButton({
  text = "완료",
  bgColor: color = "bg-blue-600",
  textColor = "text-white",
  onClick,
}: AdditionalButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full py-3 px-4 ${color} ${textColor} font-medium rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
    >
      {text}
    </button>
  );
}

export default CompletionButton;
