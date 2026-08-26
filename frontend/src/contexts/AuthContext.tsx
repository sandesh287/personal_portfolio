import type { ReactNode } from "react";
import { useMemo } from "react";

import { AuthContext } from "@/contexts/authContextValue";
import { useAuthStore } from "@/stores/authStore";

export function AuthProvider({ children }: { children: ReactNode }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isAuthReady = useAuthStore((state) => state.isAuthReady);
  const setSession = useAuthStore((state) => state.setSession);
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const setAuthReady = useAuthStore((state) => state.setAuthReady);
  const clearSession = useAuthStore((state) => state.clearSession);

  const value = useMemo(
    () => ({
      accessToken,
      user,
      isAuthenticated,
      isAuthReady,
      setSession,
      setAccessToken,
      setAuthReady,
      clearSession,
    }),
    [
      accessToken,
      clearSession,
      isAuthenticated,
      isAuthReady,
      setAccessToken,
      setAuthReady,
      setSession,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
