import { useState } from "react";
import { useNavigate } from "react-router";
import CoverLetterInfoSection from "../../../molecules/mypage/coverLetterInfoSection";
import QuestionList from "../../../organisms/mypage/questionList";
import { getStandardQuestions } from "../../../../types/coverLetter";
import CoverLetterActions from "../../../organisms/mypage/coverLetterActions";
import { createCoverLetter } from "../../../../api/coverLetterApi"; // Import API function
import type { CoverLetterRequest } from "../../../../types/coverLetter"; // Import type

function MyPageCoverLetterCreatePage() {
  const navigate = useNavigate();
  const [coverLetterName, setCoverLetterName] = useState("");
  const [answers, setAnswers] = useState<string[]>(Array(5).fill(""));

  const handleAnswerChange = (questionIndex: number, answer: string) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = answer;
    setAnswers(newAnswers);
  };

  const handleCancel = () => {
    navigate(-1); // 뒤로가기
  };

  const handleSubmit = async () => {
    // Make handleSubmit async
    try {
      const coverLetterData: CoverLetterRequest = {
        name: coverLetterName,
        answer1: answers[0] || "",
        answer2: answers[1] || "",
        answer3: answers[2] || "",
        answer4: answers[3] || "",
        answer5: answers[4] || "",
      };
      await createCoverLetter(coverLetterData);
      alert("자기소개서가 성공적으로 생성되었습니다!");
      navigate("/mypage"); // Navigate to mypage or a success page
    } catch (error) {
      console.error("자기소개서 생성 실패:", error);
      alert("자기소개서 생성에 실패했습니다. 다시 시도해주세요.");
    } finally {
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-blue-600">📄</span>
          <span className="text-xl font-semibold">자기소개서 작성</span>
        </div>
      </div>
      <CoverLetterInfoSection
        value={coverLetterName}
        type="text"
        placeholderText="예: 네이버 백엔드 개발자 지원서"
        onChange={setCoverLetterName}
      />
      <QuestionList
        questions={getStandardQuestions(answers, handleAnswerChange)}
        answers={answers}
        onAnswerChange={handleAnswerChange}
      />
      <CoverLetterActions onCancel={handleCancel} onSubmit={handleSubmit} />
    </div>
  );
}

export default MyPageCoverLetterCreatePage;
