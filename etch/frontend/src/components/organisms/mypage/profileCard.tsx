import { Link, useNavigate } from "react-router";
import { useState } from "react";
import ProfileAvatar from "../../molecules/mypage/profileAvatar";
import StatsButton from "../../molecules/mypage/statsButton";
import ActionButton from "../../molecules/mypage/actionButton";
import { deleteMember } from "../../../api/memberApi";
import type { ProfileCardData } from "../../../hooks/useUserProfile";

interface ProfileCardProps {
  userProfile: ProfileCardData;
}

const ProfileCard = ({ userProfile }: ProfileCardProps) => {
  const { nickname, profile, followerCount, followingCount } = userProfile;
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteMember = async () => {
    const confirmDelete = window.confirm(
      "정말로 회원 탈퇴하시겠습니까?\n\n탈퇴하시면 모든 데이터가 삭제되며, 복구할 수 없습니다."
    );
    
    if (!confirmDelete) return;

    const secondConfirm = window.confirm(
      "다시 한 번 확인합니다.\n\n회원 탈퇴를 진행하시겠습니까?"
    );

    if (!secondConfirm) return;

    try {
      setIsDeleting(true);
      await deleteMember();
      
      // 탈퇴 성공 시
      alert("회원 탈퇴가 완료되었습니다. 그동안 이용해 주셔서 감사합니다.");
      
      // 로컬 스토리지와 세션 스토리지 정리
      localStorage.clear();
      sessionStorage.clear();
      
      // 홈페이지로 리다이렉트
      navigate("/", { replace: true });
      
      // 페이지 새로고침으로 완전히 초기화
      window.location.href = "/";
    } catch (error) {
      console.error("회원 탈퇴 실패:", error);
      alert("회원 탈퇴에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-6">
        <div className="space-y-4 text-center">
          <ProfileAvatar
            src={profile || ""}
            alt={`${nickname}의 프로필`}
            onClick={() => {}}
          />

          <div>
            <h3 className="text-lg font-semibold">{nickname}</h3>
          </div>

          <div className="flex justify-center space-x-6 text-sm">
            <Link to="/mypage/followers">
              <StatsButton count={followerCount} label="팔로워" />
            </Link>
            <Link to="/mypage/following">
              <StatsButton count={followingCount} label="팔로잉" />
            </Link>
          </div>

          <div className="space-y-2">
            <Link to={"/mypage/portfolios"} className="block">
              <ActionButton
                text="포트폴리오 생성"
                bgColor="bg-blue-600"
                textColor="text-white"
                onClick={() => {}}
              />
            </Link>
            <Link to="/mypage/coverletters" className="block">
              <ActionButton
                text="자기소개서 생성"
                bgColor="border border-gray-300 bg-transparent"
                textColor="text-black"
                onClick={() => {}}
              />
            </Link>
            <ActionButton
              text={isDeleting ? "탈퇴 처리중..." : "회원 탈퇴"}
              bgColor="bg-red-600"
              textColor="text-white"
              onClick={handleDeleteMember}
              disabled={isDeleting}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
