import ActionButton from "../../molecules/mypage/actionButton";

interface CoverLetterActionsProps {
  onCancel: () => void;
  onSubmit: () => void;
  submitButtonText?: string; // Optional prop for custom submit button text
}

const CoverLetterActions = ({
  onCancel,
  onSubmit,
  submitButtonText,
}: CoverLetterActionsProps) => {
  return (
    <div className="flex justify-center space-x-4">
      <ActionButton
        text="취소"
        bgColor="border border-gray-300 bg-white"
        textColor="text-black"
        onClick={onCancel}
      />
      <ActionButton
        text={submitButtonText || "자기소개서 생성하기"}
        bgColor="bg-blue-600"
        textColor="text-white"
        onClick={onSubmit}
      />
    </div>
  );
};

export default CoverLetterActions;
