import { useNavigate } from "react-router";
import PortfolioButton from "../../molecules/portfolio/portfolioButton";

interface PortfolioSubmitButtonProps {
  onSubmit: () => void;
  isDisabled: boolean;
  submitButtonText?: string;
}

function PortfolioSubmitButton({
  onSubmit,
  isDisabled,
  submitButtonText = "포트폴리오 등록",
}: PortfolioSubmitButtonProps) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center w-full sm:w-auto">
      <PortfolioButton
        text="취소"
        bgColor="bg-gray-200"
        textColor="text-gray-700"
        css="px-8 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-all duration-200 whitespace-nowrap min-w-[120px] order-2 sm:order-1"
        onClick={() => {
          // 이전 페이지로 돌아가기
          navigate(-1);
        }}
      />
      <PortfolioButton
        text={submitButtonText}
        bgColor={isDisabled ? "bg-gray-400" : "bg-blue-500"}
        textColor="text-white"
        css={`px-8 py-3 rounded-lg font-semibold transition-all duration-200 whitespace-nowrap min-w-[140px] order-1 sm:order-2 ${
          isDisabled
            ? "cursor-not-allowed opacity-50"
            : "hover:bg-blue-600 cursor-pointer"
        }`}
        onClick={isDisabled ? undefined : onSubmit}
      />
    </div>
  );
}
export default PortfolioSubmitButton;
