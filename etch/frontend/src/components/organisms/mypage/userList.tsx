import UserItem from "../../molecules/mypage/userItem";
import type { UserProfile } from "../../../types/userProfile"; // UserProfile import

interface UserListProps {
  users: UserProfile[]; // 타입 변경
  listType: 'followers' | 'following'; // 목록 타입을 받도록 추가
  followStatus?: {[key: number]: boolean}; // 개별 팔로우 상태
  loadingUsers?: {[key: number]: boolean}; // 개별 로딩 상태
  chatLoadingUsers?: {[key: number]: boolean}; // 개별 채팅 로딩 상태
  onChatClick: (userId: number, targetNickname: string) => void; // 파라미터 수정
  onFollowToggle: (userId: number) => void;
}

function UserList({ users, listType, followStatus, loadingUsers, chatLoadingUsers, onChatClick, onFollowToggle }: UserListProps) {
  if (users.length === 0) {
    return (
      <div className="text-center py-16 px-5 text-gray-600">
        <div className="text-4xl mb-5 opacity-30">👥</div>
        <div className="text-lg font-semibold mb-2 text-gray-700">
          아직 사용자가 없습니다
        </div>
        <div className="text-sm text-gray-600 leading-relaxed">
          새로운 사람들을 찾아보세요!
        </div>
      </div>
    );
  }

  return (
    <div>
      {users.map((user) => {
        // followStatus가 있으면 개별 상태 사용, 없으면 기본 로직 사용
        const isFollowing = followStatus ? (followStatus[user.id] ?? false) : (listType === 'following');
        const isLoading = loadingUsers ? (loadingUsers[user.id] ?? false) : false;
        const isChatLoading = chatLoadingUsers ? (chatLoadingUsers[user.id] ?? false) : false;
        const canChat = isFollowing; // 팔로우하고 있는 경우에만 채팅 가능

        return (
          <UserItem
            key={user.id}
            {...user} // user 객체의 모든 속성을 전달
            isFollowing={isFollowing}
            isLoading={isLoading}
            isChatLoading={isChatLoading}
            canChat={canChat}
            onChatClick={onChatClick}
            onFollowToggle={onFollowToggle}
          />
        );
      })}
    </div>
  );
}

export default UserList;