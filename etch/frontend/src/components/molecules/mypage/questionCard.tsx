import type { QuestionCardProps } from "../../atoms/card";

const QuestionCard = ({
  questionNumber,
  questionTitle,
  structure,
  tips,
  keywords,
  answer,
  onAnswerChange,
}: QuestionCardProps) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="border-b border-gray-200 p-6">
        <h3 className="text-lg font-semibold">
          ✅ {questionNumber}. {questionTitle}
        </h3>
      </div>
      <div className="p-6 space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold text-sm mb-2">🔹 작성 구조</h4>
          <p className="text-sm whitespace-pre-line">{structure}</p>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-semibold text-sm mb-2">🖊 작성 팁</h4>
          <p className="text-sm whitespace-pre-line">{tips}</p>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <h4 className="font-semibold text-sm mb-2">📌 예시 키워드</h4>
          <p className="text-sm whitespace-pre-line">{keywords}</p>
        </div>

        <div>
          <label htmlFor={`answer${questionNumber}`} className="block text-sm font-medium text-gray-700 mb-1">
            답변 작성
          </label>
          <textarea
            id={`answer${questionNumber}`}
            value={answer}
            onChange={(e) => onAnswerChange(e.target.value)}
            placeholder="여기에 답변을 작성해주세요..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[150px] mt-2"
          />
        </div>
      </div>
    </div>
  );
};

export default QuestionCard;
