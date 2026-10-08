import type { AdditionalButtonProps } from "../atoms/button";
import { features, OAUTH_URL } from "../../config/features";
import googleIcon from "../../assets/google-icon.png";

function GoogleAuthButton({ text }: AdditionalButtonProps) {
  const handleGoogleLogin = () => {
    if (features.oauth) window.location.href = OAUTH_URL;
  };

  return (
    <>
      <button 
        disabled={!features.oauth}
        onClick={handleGoogleLogin}
        className="flex items-center justify-center w-full px-4 py-2 text-sm font-semibold transition-all duration-200 border border-gray-300 rounded cursor-pointer hover:brightness-90"
      >
        <img src={googleIcon} alt="Google Icon" className="w-5 h-5 mr-2" />
        <span className="text-gray-800">{features.oauth ? text : "현재 환경에서는 로그인이 비활성화되어 있습니다"}</span>
      </button>
    </>
  );
}

export default GoogleAuthButton;
