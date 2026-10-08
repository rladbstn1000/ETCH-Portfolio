import { Link, Outlet, useLocation } from "react-router";
import Header from "../components/common/header";
import Footer from "../components/common/footer";

// 공개 화면에서는 로그인 복원·refresh·채팅 provider 자체를 생성하지 않는다.
export default function PublicLayout() {
  const { pathname } = useLocation();
  return <div className="min-h-screen">
    <div className="bg-white xl:sticky xl:top-0 xl:z-50 xl:shadow-sm">
      <div className="px-6 py-3 mx-auto max-w-screen-2xl sm:px-8 lg:px-12 xl:px-16"><Header /></div>
    </div>
    <div className="bg-gray-50"><div className="px-6 py-2 mx-auto max-w-screen-2xl sm:px-8 lg:px-12 xl:px-16">
      <main className="pt-2 pb-8">{pathname === "/" || pathname === "/search" ? <Outlet /> :
        <section className="py-12"><h1 className="text-2xl font-bold">이 기능은 데모에서 제공하지 않습니다</h1><p className="my-4">공개 검색과 상세 조회를 이용해 주세요.</p><Link to="/search" className="text-blue-700 underline">데모 검색으로 이동</Link></section>}
      </main>
    </div></div>
    <Footer />
  </div>;
}
