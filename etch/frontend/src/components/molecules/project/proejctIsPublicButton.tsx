import type { ButtonProps } from "../../atoms/button";

interface Props extends ButtonProps {
  checked: boolean;
  onSelect: () => void;
}

function ProjectIsPublicButton({ text, icon, checked, onSelect }: Props) {
  return (
    <div className="group cursor-pointer" onClick={onSelect}>
      <div
        className={`border rounded-lg p-4 sm:p-6 text-center transition-all duration-200 group-hover:shadow-md ${
          checked
            ? "border-blue-500 bg-blue-50 shadow-md"
            : "border-gray-300 hover:border-blue-500 hover:bg-blue-50"
        }`}
      >
        {/* 아이콘 영역 */}
        <div className="flex justify-center mb-3">
          <div
            className={`w-8 h-8 sm:w-10 sm:h-10 transition-colors duration-200 flex items-center justify-center ${
              checked
                ? "text-blue-600"
                : "text-gray-600 group-hover:text-blue-600"
            }`}
          >
            {icon}
          </div>
        </div>

        {/* 텍스트 영역 */}
        <div
          className={`text-sm sm:text-base font-medium transition-colors duration-200 ${
            checked
              ? "text-blue-700"
              : "text-gray-700 group-hover:text-blue-700"
          }`}
        >
          {text}
        </div>
      </div>
    </div>
  );
}

export default ProjectIsPublicButton;
