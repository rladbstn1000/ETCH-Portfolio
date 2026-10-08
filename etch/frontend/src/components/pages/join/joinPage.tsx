import { Link } from "react-router";
import GoogleAuthButton from "../../molecules/googleAuthButton";

function JoinPage() {
  return (
    <>
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-md p-8 bg-white border border-gray-100 rounded-lg shadow-sm">
          <div className="mb-8 text-center">
            <h1 className="mb-4 text-2xl font-bold text-gray-900">회원가입</h1>
            <p className="mb-2 text-gray-600">
              ETCH와 함께 IT 취업을 시작하세요
            </p>
            <p className="text-sm text-gray-500">
              구글 계정으로 간편하게 가입하세요
            </p>
          </div>

          <div className="mb-6">
            <GoogleAuthButton text="Google로 회원가입" />
          </div>

          <div className="p-4 mb-6 border border-blue-100 rounded-lg bg-blue-50">
            <h3 className="mb-3 text-sm font-semibold text-blue-900">
              회원가입 혜택
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• 맞춤형 채용 정보 추천</li>
              <li>• 개인 포트폴리오 생성 및 관리</li>
              <li>• 기업 분석 리포트 제공</li>
              <li>• 커뮤니티 참여 및 네트워킹</li>
            </ul>
          </div>

          <div className="text-sm text-center text-gray-600">
            <p className="mb-4">
              이미 계정이 있으신가요?{" "}
              <Link to="/login" className="text-blue-600 hover:underline">
                로그인
              </Link>
            </p>
            <p className="text-xs text-gray-500">
              회원가입하면 ETCH의 이용약관 및 개인정보처리방침 에 동의하는
              것으로 간주됩니다.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default JoinPage;
