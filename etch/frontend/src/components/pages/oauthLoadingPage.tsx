import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { getMemberInfo } from "../../api/authApi";
import useUserStore from "../../store/userStore";
import TokenManager from "../../utils/tokenManager";

const OAuthLoadingPage = () => {
  const { setMemberInfo } = useUserStore(); // Zustand 스토어에서 사용자 정보 설정 함수 가져오기
  const navigate = useNavigate();
  const tokenRef = useRef<string | null>(null);
  const startedRef = useRef(false);

  // OAuth 리다이렉트 후 토큰 처리
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    tokenRef.current = new URLSearchParams(window.location.hash.slice(1)).get("token");
    // 토큰을 네트워크 요청/브라우저 URL에 남기지 않는다.
    window.history.replaceState(null, "", window.location.pathname);
    const token = tokenRef.current;
    tokenRef.current = null;

    if (token) {
      // 1. Access token을 TokenManager로 저장 (발급 시간 포함)
      TokenManager.setToken(token);
      if (TokenManager.getRole() === "GUEST") {
        navigate("/additional-info", { replace: true });
        return;
      }

      const checkUser = async () => {
        try {
          const userInfo = await getMemberInfo();
          // Zustand 스토어에 사용자 정보 저장
          setMemberInfo(userInfo);

          // 로그인 후 메인 페이지로 이동
          navigate("/", { replace: true });
        } catch (error: any) {
          // 신규 유저 추가 정보 페이지로
          if (error.response?.data?.message === "사용자를 찾을 수 없습니다.") {
            navigate("/additional-info", { replace: true });
          } else {
            // 기타 에러 - 로그인 페이지로
            console.error("Error fetching member info:", error.response?.status);
            alert("회원가입 중 오류가 발생했습니다. 다시 시도해주세요.");
            navigate("/join", { replace: true });
          }
        }
      };

      checkUser();
    } else {
      // 토큰이 없는 경우 - OAuth 실패로 간주
      console.error("OAuth token not found");
      alert("로그인에 실패했습니다. 다시 시도해주세요.");
      navigate("/login", { replace: true });
    }
  }, [navigate, setMemberInfo]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="max-w-xl mx-4 text-center">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-gray-800">ETCH</h1>
          <p className="text-lg text-gray-600">IT 취업의 새로운 시작</p>
        </div>

        <div className="p-12 mb-6 bg-white shadow-sm rounded-2xl min-h-[320px] min-w-[400px] flex flex-col justify-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 border-4 rounded-full border-brand-100 border-t-brand-500 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-brand-500">G</span>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-800">
              로그인 중...
            </h2>
            <p className="text-gray-600">잠시만 기다려 주세요</p>

            <div className="flex justify-center pt-2 space-x-1">
              <div className="w-2 h-2 rounded-full bg-brand-500 animate-bounce"></div>
              <div
                className="w-2 h-2 rounded-full bg-brand-500 animate-bounce"
                style={{ animationDelay: "0.1s" }}
              ></div>
              <div
                className="w-2 h-2 rounded-full bg-brand-500 animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OAuthLoadingPage;
