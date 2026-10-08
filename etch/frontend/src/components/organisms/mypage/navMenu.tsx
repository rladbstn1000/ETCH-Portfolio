import { useLocation } from "react-router";
import NavButton from "../../molecules/mypage/navButton";

const NavMenu = () => {
  const location = useLocation(); // 버튼 활성화 상태를 확인하기 위해 현재 경로를 가져옵니다.

  const menuItems = [
    { text: "대시보드", to: "/mypage", icon: "🏢" },
    { text: "지원 현황", to: "/mypage/applications", icon: "📄" },
    { text: "관심 목록", to: "/mypage/favorites", icon: "❤️" },
    { text: "내 프로젝트", to: "/mypage/projects", icon: "📁" },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-4">
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <NavButton
              key={item.to}
              text={item.text}
              icon={item.icon}
              to={item.to}
              isActive={location.pathname === item.to}
            />
          ))}
        </nav>
      </div>
    </div>
  );
};

export default NavMenu;
