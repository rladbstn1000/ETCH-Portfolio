import type { StackButtonProps } from "../../atoms/button";

function ProjectStackButton({
  id,
  text,
  isSelected,
  onSelect,
}: StackButtonProps) {
  return (
    <div
      className="group cursor-pointer relative"
      onClick={() => onSelect(id)} // ID를 전달
    >
      <div
        className={`border rounded-lg p-4 sm:p-6 text-center transition-all duration-200 group-hover:shadow-md ${
          isSelected
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-blue-500 hover:bg-blue-50"
        }`}
      >
        {isSelected && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shadow-sm">
            <svg
              className="w-3 h-3 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}

        <div
          className={`text-sm sm:text-base font-medium transition-colors duration-200 ${
            isSelected
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

export default ProjectStackButton;
