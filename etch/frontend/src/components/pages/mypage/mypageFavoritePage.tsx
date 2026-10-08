import FavoriteProjectList from "../../organisms/mypage/favorite/favoriteProjectList";
import FavoriteCompanyList from "../../organisms/mypage/favorite/favoriteCompanyList";
import FavoriteJobList from "../../organisms/mypage/favorite/favoriteJobList";
import FavoriteNewsList from "../../organisms/mypage/favorite/favoriteNewsList";

function MypageFavoritePage() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* 상단 영역: 관심 기업, 관심 공고, 관심 뉴스 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div>
          <FavoriteCompanyList
            titleText="관심 기업"
            subText="등록한 관심 기업들"
          />
        </div>
        <div>
          <FavoriteJobList
            titleText="관심 공고"
            subText="북마크한 채용공고"
          />
        </div>
        <div>
          <FavoriteNewsList
            titleText="관심 뉴스"
            subText="좋아요한 뉴스"
          />
        </div>
      </div>

      {/* 하단 영역: 관심 프로젝트 */}
      <div className="w-full">
        <FavoriteProjectList
          titleText="관심 프로젝트"
          subText="좋아요한 프로젝트"
          sliceCount={100}
          // favoriteData, mockProjects props 제거 - 컴포넌트 내부에서 API 호출
        />
      </div>
    </div>
  );
}

export default MypageFavoritePage;
