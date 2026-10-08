import { useNavigate } from "react-router";
import type { ProfileCardData } from "../hooks/useUserProfile";
import StatsButton from "../components/molecules/mypage/statsButton";
import ActionButton from "../components/molecules/mypage/actionButton";
import { publicAssets } from "./data";

/** A virtual profile: no account action, upload, token or browser storage. */
export default function ProfileCard({ userProfile }: { userProfile: ProfileCardData }) {
  const navigate = useNavigate();
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm text-center space-y-4" aria-label="가상 사용자 프로필">
      <img src={publicAssets.profile} alt="가상 사용자 프로필 그림" className="mx-auto h-20 w-20 rounded-full" />
      <div>
        <h2 className="text-lg font-semibold">{userProfile.nickname}</h2>
        <p className="mt-1 text-sm text-gray-500">로그인 없이 둘러보는 가상 사용자</p>
      </div>
      <div className="flex justify-center gap-6 text-sm">
        <StatsButton count={userProfile.followerCount} label="예시 팔로워" onClick={() => navigate("/mypage/followers")} />
        <StatsButton count={userProfile.followingCount} label="예시 팔로잉" onClick={() => navigate("/mypage/following")} />
      </div>
      <div className="space-y-2">
        <ActionButton text="포트폴리오 예시" bgColor="bg-blue-600" textColor="text-white" onClick={() => navigate("/mypage/portfolios")} />
        <ActionButton text="자기소개서 예시" bgColor="border border-gray-300 bg-white" textColor="text-black" onClick={() => navigate("/mypage/coverletters")} />
        <ActionButton text="예시 대화 보기" bgColor="bg-gray-100" textColor="text-gray-700" onClick={() => navigate("/chat")} />
      </div>
      <p className="text-xs leading-relaxed text-gray-500">계정 생성·탈퇴와 파일 업로드는 체험 범위에 포함하지 않습니다.</p>
    </section>
  );
}
