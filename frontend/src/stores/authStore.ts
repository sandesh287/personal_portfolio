import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { AuthState, AuthUser } from "@/types/auth";

interface AuthActions {
  setSession: (accessToken: string, refreshToken: string, user: AuthUser) => void;
  setAccessToken: (accessToken: string) => void;
  setAuthReady: (isAuthReady: boolean) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      isAuthReady: false,
      setSession: (accessToken, refreshToken, user) =>
        set({ accessToken, refreshToken, user, isAuthenticated: true, isAuthReady: true }),
      setAccessToken: (accessToken) => set({ accessToken, isAuthenticated: true }),
      setAuthReady: (isAuthReady) => set({ isAuthReady }),
      clearSession: () =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
          isAuthReady: true,
        }),
    }),
    {
      name: "sandesh-admin-auth",
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setAuthReady(true);
      },
    },
  ),
);
