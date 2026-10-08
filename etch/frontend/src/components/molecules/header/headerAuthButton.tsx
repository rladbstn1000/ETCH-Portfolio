import type { AdditionalButtonProps } from "../../atoms/button";

function HeaderAuthButton({
  text,
  bgColor: color,
  textColor,
  onClick,
}: AdditionalButtonProps) {
  // 버튼 스타일 변형 결정
  const isPrimary = color === "#007DFC";
  const isOutline = color === "#FFFFFF";
  
  const getButtonClasses = () => {
    const baseClasses = "flex items-center justify-center px-4 py-2 text-sm font-semibold transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm";
    
    if (isPrimary) {
      return `${baseClasses} text-white bg-blue-600 border border-blue-600 hover:bg-blue-700 hover:border-blue-700 hover:shadow-md`;
    } else if (isOutline) {
      return `${baseClasses} text-blue-600 bg-white border border-blue-200 hover:bg-blue-50 hover:border-blue-300`;
    } else {
      // 기본 스타일 (기존 방식 유지)
      return `${baseClasses} border border-gray-300 hover:brightness-90`;
    }
  };

  return (
    <button
      onClick={onClick}
      style={!isPrimary && !isOutline ? { backgroundColor: color } : undefined}
      className={getButtonClasses()}
    >
      {text && (
        <span style={!isPrimary && !isOutline ? { color: textColor } : undefined}>
          {text}
        </span>
      )}
    </button>
  );
}

export default HeaderAuthButton;
