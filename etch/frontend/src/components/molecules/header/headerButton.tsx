import type { ButtonProps } from "../../atoms/button";

function HeaderButton({ text, img, onClick }: ButtonProps) {
  return (
    <button
      type="button"
      aria-label="헤더 검색"
      onClick={onClick}
      className="flex items-center justify-center w-8 h-8 text-xs font-medium text-gray-600 transition-all duration-200 rounded-lg cursor-pointer sm:w-9 sm:h-9 sm:text-sm hover:text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      {img && (
        <img
          src={img}
          alt="검색"
          className="w-4 h-4 sm:w-5 sm:h-5 opacity-70"
        />
      )}
      {text && <span className="hidden ml-1 sm:inline">{text}</span>}
    </button>
  );
}

export default HeaderButton;
