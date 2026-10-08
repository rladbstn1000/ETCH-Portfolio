import { createBrowserRouter } from "react-router";
import { lazy, Suspense } from "react";
import Layout from "../layout/layout.tsx";
import ErrorPage from "../components/pages/errorPage.tsx";
import LoadingPage from "../components/pages/loadingPage.tsx";
import SearchPage from "../components/pages/searchPage.tsx";
import ProtectedRoute from "../components/common/ProtectedRoute.tsx";

const HomePage = lazy(() => import("../components/pages/homePage.tsx"));
const NewsPage = lazy(
  () => import("../components/pages/news/newsMainPage.tsx")
);
const NewsLatestPage = lazy(
  () => import("../components/pages/news/newsLatestPage.tsx")
);

const JoinPage = lazy(() => import("../components/pages/join/joinPage.tsx"));
const LoginPage = lazy(() => import("../components/pages/loginPage.tsx"));
const OAuthLoadingPage = lazy(
  () => import("../components/pages/oauthLoadingPage.tsx")
);
const AdditionalInfoPage = lazy(
  () => import("../components/pages/join/additionalInfoPage.tsx")
);

const ProjectListPage = lazy(
  () => import("../components/pages/project/projectListPage.tsx")
);
const ProjectWritePage = lazy(
  () => import("../components/pages/project/projectWritePage.tsx")
);
const ProjectUpdatePage = lazy(
  () => import("../components/pages/project/projectUpdatePage.tsx")
);
const JobPage = lazy(() => import("../components/pages/job/jobPage.tsx"));
const MyPageLayout = lazy(() => import("../layout/mypageLayout.tsx"));
const DashboardPage = lazy(
  () => import("../components/pages/mypage/dashboardPage.tsx")
);

const MypageProjectPage = lazy(
  () => import("../components/pages/mypage/mypageProjectPage.tsx")
);
const MypageApplicationsPage = lazy(
  () => import("../components/pages/mypage/mypageApplicationsPage.tsx")
);

const MypageFavoritePage = lazy(
  () => import("../components/pages/mypage/mypageFavoritePage.tsx")
);

const DetailFavoriteProject = lazy(
  () => import("../components/pages/mypage/favorite/detailFavoriteProject.tsx")
);

const MypageCoverLetterPage = lazy(
  () =>
    import("../components/pages/mypage/coverletter/mypageCoverLetterPage.tsx")
);
const MypageFollowerPage = lazy(
  () => import("../components/pages/mypage/mypageFollowerPage.tsx")
);
const MypageFollowingPage = lazy(
  () => import("../components/pages/mypage/mypageFollowingPage.tsx")
);
const MypagePortfolioPage = lazy(
  () => import("../components/pages/mypage/mypagePortfolioPage.tsx")
);
const MyPageCoverLetterEditPage = lazy(
  () =>
    import(
      "../components/pages/mypage/coverletter/MyPageCoverLetterEditPage.tsx"
    )
);
const MyPageCoverLetterDetailPage = lazy(
  () =>
    import(
      "../components/pages/mypage/coverletter/MyPageCoverLetterDetailPage.tsx"
    )
);
const UserProfilePage = lazy(
  () => import("../components/pages/userProfilePage.tsx")
);
const MypagePortfolioDetail = lazy(
  () => import("../components/pages/mypage/mypagePortfolioDetail.tsx")
);
const MypagePortfolioEditPage = lazy(
  () => import("../components/pages/mypage/mypagePortfolioEditPage.tsx")
);

const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<LoadingPage />}>
            <HomePage />
          </Suspense>
        ),
      },
      {
        path: "*",
        element: <ErrorPage />,
      },
      {
        path: "/loading",
        element: <LoadingPage />,
      },
      {
        path: "/search",
        element: (
          <Suspense fallback={<LoadingPage />}>
            <SearchPage />
          </Suspense>
        ),
      },
      {
        path: "/news",
        element: (
          <Suspense fallback={<LoadingPage />}>
            <NewsPage />
          </Suspense>
        ),
      },
      {
        path: "/news/latest",
        element: (
          <Suspense fallback={<LoadingPage />}>
            <NewsLatestPage />
          </Suspense>
        ),
      },

      {
        path: "/join",
        element: (
          <Suspense fallback={<LoadingPage />}>
            <JoinPage />
          </Suspense>
        ),
      },
      {
        path: "/login",
        element: (
          <Suspense fallback={<LoadingPage />}>
            <LoginPage />
          </Suspense>
        ),
      },
      {
        path: "/Oauth",
        element: <OAuthLoadingPage />,
      },
      {
        path: "/additional-info",
        element: (
          <Suspense fallback={<LoadingPage />}>
            <AdditionalInfoPage />
          </Suspense>
        ),
      },
      {
        path: "/projects",
        element: (
          <Suspense fallback={<LoadingPage />}>
            <ProjectListPage />
          </Suspense>
        ),
      },
      {
        path: "/projects/write",
        element: (
          <ProtectedRoute showMessage={true}>
            <Suspense fallback={<LoadingPage />}>
              <ProjectWritePage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: "/projects/:id/edit",
        element: (
          <ProtectedRoute showMessage={true}>
            <Suspense fallback={<LoadingPage />}>
              <ProjectUpdatePage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: "/jobs",
        element: (
          <Suspense fallback={<LoadingPage />}>
            <JobPage />
          </Suspense>
        ),
      },
      {
        path: "members/:userId/projects",
        element: (
          <ProtectedRoute showMessage={true}>
            <Suspense fallback={<LoadingPage />}>
              <UserProfilePage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: "/mypage",
        element: (
          <ProtectedRoute showMessage={true}>
            <Suspense fallback={<LoadingPage />}>
              <MyPageLayout />
            </Suspense>
          </ProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<LoadingPage />}>
                <DashboardPage />
              </Suspense>
            ),
          },
          {
            path: "applications",
            element: (
              <Suspense fallback={<LoadingPage />}>
                <MypageApplicationsPage />
              </Suspense>
            ),
          },
          {
            path: "portfolios",
            element: (
              <Suspense fallback={<LoadingPage />}>
                <MypagePortfolioPage />
              </Suspense>
            ),
          },
          {
            path: "portfolios/:userId",
            element: (
              <Suspense fallback={<LoadingPage />}>
                <MypagePortfolioDetail />
              </Suspense>
            ),
          },
          {
            path: "portfolios/edit/:id",
            element: (
              <Suspense fallback={<LoadingPage />}>
                <MypagePortfolioEditPage />
              </Suspense>
            ),
          },

          {
            path: "favorites",
            element: (
              <Suspense fallback={<LoadingPage />}>
                <MypageFavoritePage />
              </Suspense>
            ),
          },
          {
            path: "favorites/projects",
            element: (
              <Suspense fallback={<LoadingPage />}>
                <DetailFavoriteProject />
              </Suspense>
            ),
          },
          {
            path: "projects",
            element: (
              <Suspense fallback={<LoadingPage />}>
                <MypageProjectPage />
              </Suspense>
            ),
          },
          {
            path: "coverletters",
            element: (
              <Suspense fallback={<LoadingPage />}>
                <MypageCoverLetterPage />
              </Suspense>
            ),
          },
          {
            path: "cover-letter-edit/:id",
            element: (
              <Suspense fallback={<LoadingPage />}>
                <MyPageCoverLetterEditPage />
              </Suspense>
            ),
          },
          {
            path: "cover-letter-detail/:id",
            element: (
              <Suspense fallback={<LoadingPage />}>
                <MyPageCoverLetterDetailPage />
              </Suspense>
            ),
          },
          {
            path: "followers",
            element: (
              <Suspense fallback={<LoadingPage />}>
                <MypageFollowerPage />
              </Suspense>
            ),
          },
          {
            path: "following",
            element: (
              <Suspense fallback={<LoadingPage />}>
                <MypageFollowingPage />
              </Suspense>
            ),
          },
        ],
      },
    ],
  },
]);

export default router;
