import { Navigate, Outlet, useLocation } from "react-router";

import { routes } from "@/constants/routes";
import { useAuthStore } from "@/stores/authStore";

export function ProtectedRoute() {
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate replace to={routes.adminLogin} state={{ from: location }} />;
  }

  return <Outlet />;
}
