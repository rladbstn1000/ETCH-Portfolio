import QuestionCard from "../../molecules/mypage/questionCard";
import type { QuestionCardProps } from "../../atoms/card";

interface QuestionListProps {
  questions: QuestionCardProps[];
  answers: string[];
  onAnswerChange: (questionIndex: number, answer: string) => void;
}

const QuestionList = ({ questions, answers, onAnswerChange }: QuestionListProps) => {
  return (
    <div className="space-y-6 mb-6">
      {questions.map((question, index) => (
        <QuestionCard
          key={index}
          {...question}
          answer={answers[index] || ""}
          onAnswerChange={(answer) => onAnswerChange(index, answer)}
        />
      ))}
    </div>
  );
};

export default QuestionList;