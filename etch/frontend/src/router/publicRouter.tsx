import { createBrowserRouter } from "react-router";
import Layout from "../layout/publicLayout";
import HomePage from "../components/pages/demoHomePage";
import SearchPage from "../components/pages/searchPage";
// 같은 React 화면을 재사용하며 미지원 페이지를 공개 빌드의 route chunk로 만들지 않는다.
export default createBrowserRouter([{path: "/", Component: Layout, children: [
  {index: true, Component: HomePage},
  {path: "search", Component: SearchPage},
  {path: "*", element: null},
]}]);
