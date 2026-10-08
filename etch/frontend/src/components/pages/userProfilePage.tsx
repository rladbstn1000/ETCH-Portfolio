import { useState, useEffect } from "react";
import { useParams } from "react-router";
import type { ProjectData } from "../../types/project/projectDatas";
import { getUserPublicProjects } from "../../api/projectApi";
import { checkFollowExists, followUser, unfollowUser } from "../../api/followApi";
import { chatApi } from "../../api/chatApi.tsx";
import { useUserProfile } from "../../hooks/useUserProfile";
import { useModalContext } from "../../contexts/modalContext";
import { getCurrentUserName } from "../../utils/userUtils";
import UserProfileCard from "../organisms/userprofile/userProfileCard";
import UserProjectList from "../organisms/userprofile/userProjectList";

// UserProfilePage는 props를 받지 않고, URL 파라미터만 사용
function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>(); // URL에서 userId 추출

  // 훅을 사용한 사용자 프로필 데이터
  const { profileData, isLoading: profileLoading, error: profileError } = useUserProfile(userId ? Number(userId) : undefined);
  const { openChatModal } = useModalContext();
  
  // 상태 관리
  const [userProjects, setUserProjects] = useState<ProjectData[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 프로젝트와 팔로우 상태 로딩
  useEffect(() => {
    const loadUserData = async () => {
      if (!userId) return;

      try {
        setProjectsLoading(true);

        // 병렬로 프로젝트와 팔로우 상태 로딩
        const [projects, followStatus] = await Promise.all([
          getUserPublicProjects(Number(userId)),
          checkFollowExists(Number(userId)).catch(() => false)
        ]);

        setUserProjects(projects);
        setIsFollowing(followStatus);
      } catch (err) {
        console.error("사용자 데이터 로딩 실패:", err);
        setError("사용자 정보를 불러오는데 실패했습니다.");
      } finally {
        setProjectsLoading(false);
      }
    };

    loadUserData();
  }, [userId]);

  // 프로젝트 업데이트 핸들러
  const handleProjectUpdate = (updatedProject: ProjectData) => {
    setUserProjects((prevProjects) =>
      prevProjects.map((project) =>
        project.id === updatedProject.id ? updatedProject : project
      )
    );
  };

  // 팔로우/언팔로우 핸들러
  const handleFollowClick = async () => {
    if (!userId || followLoading || !profileData) return;

    setFollowLoading(true);
    
    try {
      if (isFollowing) {
        // 언팔로우
        await unfollowUser(Number(userId));
        setIsFollowing(false);
      } else {
        // 팔로우
        await followUser(Number(userId));
        setIsFollowing(true);
      }
    } catch (error) {
      console.error("팔로우 토글 실패:", error);
      alert("팔로우 처리 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setFollowLoading(false);
    }
  };

  // 채팅 핸들러 (새로운 API 명세 적용)
  const handleChatClick = async () => {
    if (!userId || chatLoading || !profileData) return;

    setChatLoading(true);
    
    try {
      // 현재 사용자와 대상 사용자의 닉네임 가져오기
      const myNickname = getCurrentUserName();
      const targetNickname = profileData.nickname;
      
      // 1:1 채팅방 생성 (새로운 API 사용)
      const chatRoom = await chatApi.createDirectChat({
        targetUserId: Number(userId),
        myNickname: myNickname,
        targetNickname: targetNickname
      });
      
      // 채팅 모달을 열고 해당 채팅방으로 이동
      openChatModal(chatRoom.roomId);
      
    } catch (error) {
      console.error("채팅방 생성 실패:", error);
      alert("채팅을 시작할 수 없습니다. 다시 시도해주세요.");
    } finally {
      setChatLoading(false);
    }
  };

  if (profileLoading || projectsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">사용자 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (profileError || error || !profileData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            오류가 발생했습니다
          </h2>
          <p className="text-gray-600 mb-4">{profileError || error || "사용자 정보를 찾을 수 없습니다."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 왼쪽: 사용자 프로필 카드 */}
          <div className="lg:col-span-1">
            <UserProfileCard
              userId={userId || ""}
              nickname={profileData.nickname}
              email={profileData.email}
              profile={profileData.profile}
              followersCount={profileData.followerCount}
              followingCount={profileData.followingCount}
              isFollowing={isFollowing}
              isFollowLoading={followLoading}
              isChatLoading={chatLoading}
              onFollowClick={handleFollowClick}
              onChatClick={handleChatClick}
            />
          </div>

          {/* 오른쪽: 사용자 프로젝트 목록 */}
          <div className="lg:col-span-3">
            <UserProjectList
              projects={userProjects}
              onProjectUpdate={handleProjectUpdate}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserProfilePage;
