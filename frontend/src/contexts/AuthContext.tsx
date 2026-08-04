import type { ReactNode } from "react";
import { useMemo } from "react";

import { AuthContext } from "@/contexts/authContextValue";
import { useAuthStore } from "@/stores/authStore";

export function AuthProvider({ children }: { children: ReactNode }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);

  const value = useMemo(
    () => ({ accessToken, user, isAuthenticated, setSession, clearSession }),
    [accessToken, clearSession, isAuthenticated, setSession, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
