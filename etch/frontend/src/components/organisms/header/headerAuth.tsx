import HeaderAuthButton from "../../molecules/header/headerAuthButton";
import { useNavigate } from "react-router";
import useUserStore from "../../../store/userStore";
import defaultProfile from "../../../assets/default-profile.png";

function HeaderAuth() {
  const navigate = useNavigate();
  const { isLoggedIn, memberInfo, logout } = useUserStore();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="flex items-center gap-3">
      {isLoggedIn && memberInfo ? (
        // 로그인 된 상태
        <>
          <HeaderAuthButton
            text="로그아웃"
            bgColor="#FFFFFF"
            textColor="#007DFC"
            onClick={handleLogout}
          />
          <button 
            onClick={() => navigate("/mypage")} 
            className="relative group"
          >
            <div className="w-10 h-10 transition-all duration-200 border-2 border-gray-200 rounded-full group-hover:border-blue-400 group-hover:shadow-md">
              <img
                src={memberInfo.profile || defaultProfile}
                alt={`${memberInfo.nickname || '사용자'} 프로필`}
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            {/* 호버 시 툴팁 */}
            <div className="absolute right-0 mt-2 px-3 py-1 text-xs text-white bg-gray-800 rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
              {memberInfo.nickname || '마이페이지'}
            </div>
          </button>
        </>
      ) : (
        // 로그아웃 된 상태
        <>
          <HeaderAuthButton
            text="로그인"
            bgColor="#FFFFFF"
            textColor="#007DFC"
            onClick={() => navigate("/login")}
          />
          <HeaderAuthButton
            text="회원가입"
            bgColor="#007DFC"
            textColor="#FFFFFF"
            onClick={() => navigate("/join")}
          />
        </>
      )}
    </div>
  );
}

export default HeaderAuth;
