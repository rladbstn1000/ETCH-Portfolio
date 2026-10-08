import { Link, useNavigate, useSearchParams } from "react-router";
import { useEffect } from "react";
import GoogleAuthButton from "../molecules/googleAuthButton";
import TokenManager from "../../utils/tokenManager";

function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // OAuth 리다이렉트 후 토큰 처리
  useEffect(() => {
    const token = searchParams.get("token");

    if (token) {
      // 1. Access token을 TokenManager로 저장
      TokenManager.setToken(token);

      // 2. 쿠키에서 refresh token 존재 확인
      const hasRefreshToken = document.cookie
        .split(";")
        .some((cookie) => cookie.trim().startsWith("refresh"));

      // 3. refresh token 유무에 따른 라우팅
      if (hasRefreshToken) {
        // 기존 유저 - 메인 페이지로
        navigate("/", { replace: true });
      } else {
        // 신규 유저 - 추가 정보 페이지로
        navigate("/additional-info", { replace: true });
      }
    }
  }, [searchParams, navigate]);

  return (
    <>
      <div className="flex items-center justify-center min-h-screen px-4 ">
        <div className="w-full max-w-md p-8 bg-white border border-gray-100 rounded-lg shadow-sm">
          <div className="mb-8 text-center">
            <h1 className="mb-4 text-2xl font-bold text-gray-900">로그인</h1>
            <p className="mb-2 text-gray-600">ETCH에 오신 것을 환영합니다</p>
            <p className="text-sm text-gray-500">
              구글 계정으로 간편하게 로그인하세요
            </p>
          </div>

          <div className="mb-6">
            <GoogleAuthButton text="Google로 로그인" />
          </div>

          <div className="text-sm text-center text-gray-600">
            <p className="mb-4">
              아직 계정이 없으신가요?{" "}
              <Link to="/join" className="text-blue-600 hover:underline">
                회원가입
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default LoginPage;
