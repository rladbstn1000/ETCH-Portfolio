import { type ReactNode } from "react";
import { Navigate } from "react-router";
import useUserStore from "../../store/userStore";

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
  showMessage?: boolean;
}

export const ProtectedRoute = ({
  children,
  redirectTo = "/login",
  showMessage = false,
}: ProtectedRouteProps) => {
  const { isLoggedIn } = useUserStore();

  if (!isLoggedIn) {
    if (showMessage) {
      // 선택적으로 알림 표시
      alert("로그인이 필요한 페이지입니다. 로그인 후 다시 시도해주세요.");
    }

    // 로그인 페이지로 리다이렉트 (이전 페이지 기억하지 않음)
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
