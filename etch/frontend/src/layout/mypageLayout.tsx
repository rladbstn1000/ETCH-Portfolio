import { Outlet } from "react-router";
import NavMenu from "../components/organisms/mypage/navMenu";
import ProfileCard from "../components/organisms/mypage/profileCard";
import { useUserProfile } from "../hooks/useUserProfile";

const MyPageLayout = () => {
  const { profileData, isLoading, error } = useUserProfile();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-1 space-y-4">
        {error && <div className="text-red-500">{error}</div>}
        {isLoading ? (
          <div>로딩 중...</div>
        ) : (
          profileData && <ProfileCard userProfile={profileData} />
        )}
        <NavMenu />
      </div>
      <div className="lg:col-span-3">
        <Outlet />
      </div>
    </div>
  );
};

export default MyPageLayout;
