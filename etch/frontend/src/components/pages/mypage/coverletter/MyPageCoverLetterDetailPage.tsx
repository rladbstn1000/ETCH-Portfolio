import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { getCoverLetterDetail } from "../../../../api/coverLetterApi";
import type { CoverLetterDetailResponse } from "../../../../types/coverLetter";
import { COVER_LETTER_QUESTIONS_STATIC } from "../../../../types/coverLetter";

function MyPageCoverLetterDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const coverLetterId = id ? Number(id) : null;

  const [coverLetter, setCoverLetter] =
    useState<CoverLetterDetailResponse | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!coverLetterId) {
      setError("자기소개서 ID가 없습니다.");
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
        setCoverLetter(data);
      } catch (err) {
        console.error("자기소개서 상세 정보 불러오기 실패:", err);
        setError("자기소개서 상세 정보를 불러오는데 실패했습니다.");
      } finally {
        setIsFetching(false);
      }
    };
    fetchCoverLetter();
  }, [coverLetterId]);

  const handleEdit = () => {
    navigate(`/mypage/cover-letter-edit/${coverLetterId}`);
  };

  const handleBack = () => {
    navigate(-1); // Go back to previous page
  };

  if (isFetching) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg text-gray-600">
          자기소개서 정보를 불러오는 중...
        </p>
      </div>
    );
  }

  if (error && !isFetching) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg text-red-500">{error}</p>
      </div>
    );
  }

  if (!coverLetter) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg text-gray-600">자기소개서를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {" "}
      {/* Simpler container */}
      <div className="mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-blue-600">📄</span>
          <span className="text-xl font-semibold">자기소개서 상세 보기</span>
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
        {" "}
        {/* Consistent card styling */}
        <h3 className="text-lg font-semibold mb-4 border-b border-gray-300 pb-2">
          {coverLetter.name}
        </h3>{" "}
        {/* Consistent header */}
        <div className="space-y-6">
          {" "}
          {/* Consistent spacing */}
          {COVER_LETTER_QUESTIONS_STATIC.map((question, index) => (
            <div key={index} className="space-y-2">
              {" "}
              {/* Simple question/answer grouping */}
              <p className="font-medium text-gray-700">
                Q{question.questionNumber}. {question.questionTitle}
              </p>
              <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                {" "}
                {/* Simple answer box */}
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {
                    coverLetter[
                      `answer${index + 1}` as keyof CoverLetterDetailResponse
                    ]
                  }
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-end space-x-4 mt-8">
        <button
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
          onClick={handleBack}
        >
          뒤로가기
        </button>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          onClick={handleEdit}
        >
          수정하기
        </button>
      </div>
    </div>
  );
}

export default MyPageCoverLetterDetailPage;
