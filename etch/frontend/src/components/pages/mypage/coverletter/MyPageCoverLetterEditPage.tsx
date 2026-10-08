import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import CoverLetterInfoSection from "../../../molecules/mypage/coverLetterInfoSection";
import QuestionList from "../../../organisms/mypage/questionList";
import { getStandardQuestions } from "../../../../types/coverLetter";
import CoverLetterActions from "../../../organisms/mypage/coverLetterActions";
import {
  getCoverLetterDetail,
  updateCoverLetter,
} from "../../../../api/coverLetterApi";
import type {
  CoverLetterRequest,
  CoverLetterDetailResponse,
} from "../../../../types/coverLetter";

function MyPageCoverLetterEditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const coverLetterId = id ? Number(id) : null;

  const [coverLetterName, setCoverLetterName] = useState("");
  const [answers, setAnswers] = useState<string[]>(Array(5).fill(""));
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!coverLetterId) {
      setError("수정할 자기소개서 ID가 없습니다.");
      setIsFetching(false);
      return;
    }

    const fetchCoverLetter = async () => {
      setIsFetching(true);
      setError(null);
      try {
        const data: CoverLetterDetailResponse = await getCoverLetterDetail(
          coverLetterId
        );
        setCoverLetterName(data.name);
        setAnswers([
          data.answer1 || "",
          data.answer2 || "",
          data.answer3 || "",
          data.answer4 || "",
          data.answer5 || "",
        ]);
      } catch (err) {
        console.error("자기소개서 상세 정보 불러오기 실패:", err);
        setError("자기소개서 상세 정보를 불러오는데 실패했습니다.");
      } finally {
        setIsFetching(false);
      }
    };
    fetchCoverLetter();
  }, [coverLetterId]);

  const handleAnswerChange = (questionIndex: number, answer: string) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = answer;
    setAnswers(newAnswers);
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const handleSubmit = async () => {
    if (!coverLetterId) return; // Should not happen if ID check is done

    setError(null);
    try {
      const coverLetterData: CoverLetterRequest = {
        name: coverLetterName,
        answer1: answers[0] || "",
        answer2: answers[1] || "",
        answer3: answers[2] || "",
        answer4: answers[3] || "",
        answer5: answers[4] || "",
      };

      await updateCoverLetter(coverLetterId, coverLetterData);
      alert("자기소개서가 성공적으로 수정되었습니다!");
      navigate("/mypage");
    } catch (err) {
      console.error("자기소개서 수정 실패:", err);
      setError("자기소개서 수정에 실패했습니다. 다시 시도해주세요.");
    } finally {
    }
  };

  if (isFetching) {
    return <p>자기소개서 정보를 불러오는 중...</p>;
  }

  if (error && !isFetching) {
    return <p style={{ color: "red" }}>{error}</p>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-blue-600">📄</span>
          <span className="text-xl font-semibold">자기소개서 수정</span>
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
      <CoverLetterActions
        onCancel={handleCancel}
        onSubmit={handleSubmit}
        submitButtonText={"자소서 수정하기"}
      />
    </div>
  );
}

export default MyPageCoverLetterEditPage;
