import { Navigate, Outlet, useLocation } from "react-router";

import { LoadingScreen } from "@/components/common/LoadingScreen";
import { routes } from "@/constants/routes";
import { useAuthStore } from "@/stores/authStore";

export function ProtectedRoute() {
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isAuthReady = useAuthStore((state) => state.isAuthReady);

  if (!isAuthReady) {
    return <LoadingScreen label="Restoring admin session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate replace to={routes.adminLogin} state={{ from: location }} />;
  }

  return <Outlet />;
}
