import type {
  PortfolioStackData,
  PortfolioStackEnum,
} from "../../../types/portfolio/portfolioStack";

// 범용 Select 컴포넌트
interface SelectProps {
  options: Array<{ value: string; label: string }>;
  onChange?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

function Select({
  options,
  onChange,
  disabled = false,
  placeholder = "선택하세요",
  className = "",
}: SelectProps) {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    if (onChange && value) {
      onChange(value);
      // 선택 후 초기화
      event.target.value = "";
    }
  };

  return (
    <select
      onChange={handleChange}
      disabled={disabled}
      className={`w-full max-w-md px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 ${
        disabled ? "bg-gray-100 cursor-not-allowed" : ""
      } ${className}`}
      defaultValue=""
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

interface PortfolioStackProps {
  isStackData: PortfolioStackData[];
  isSelect: PortfolioStackEnum[]; // 선택된 스택들의 배열
  onStackChange: (stack: PortfolioStackEnum) => void; // 개별 스택 추가
}

function PortfolioStackSelect({
  isStackData,
  isSelect,
  onStackChange,
}: PortfolioStackProps) {
  // 아직 선택되지 않은 스택들만 드롭다운에 표시
  const availableStacks = isStackData.filter(
    (stack) => !isSelect.includes(stack.stack)
  );

  // Select 컴포넌트용 옵션 데이터 변환
  const selectOptions = availableStacks.map((stack) => ({
    value: stack.stack,
    label: stack.text,
  }));

  const handleStackSelect = (value: string) => {
    const selectedStack = value as PortfolioStackEnum;
    onStackChange(selectedStack);
  };

  const handleStackRemove = (stack: PortfolioStackEnum) => {
    // 제거 로직은 부모 컴포넌트에서 처리하거나, 별도 함수로 분리 필요
    // 현재는 onStackChange를 토글 방식으로 사용한다고 가정
    onStackChange(stack);
  };

  return (
    <div className="space-y-6">
      {/* 기술 스택 선택 영역 */}
      <div>
        <Select
          options={selectOptions}
          onChange={handleStackSelect}
          disabled={availableStacks.length === 0}
          placeholder={
            availableStacks.length === 0
              ? "모든 기술 스택이 선택되었습니다"
              : "기술 스택을 선택하세요"
          }
        />
      </div>

      {/* 선택된 기술 스택 표시 영역 */}
      {isSelect.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-3">
            선택된 기술 스택
          </h4>
          <div className="flex flex-wrap gap-2">
            {isSelect.map((selectedStack) => {
              const stackData = isStackData.find(
                (data) => data.stack === selectedStack
              );
              return stackData ? (
                <div
                  key={selectedStack}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                >
                  {stackData.text}
                  <button
                    onClick={() => handleStackRemove(selectedStack)}
                    className="ml-1 hover:bg-blue-200 rounded-full p-0.5 transition-colors duration-200"
                    aria-label={`${stackData.text} 제거`}
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              ) : null;
            })}
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {isSelect.length}개의 기술 스택이 선택되었습니다.
          </p>
        </div>
      )}
    </div>
  );
}

export default PortfolioStackSelect;
export { Select };
