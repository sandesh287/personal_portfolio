import { create } from "zustand";

import type { AuthState, AuthUser } from "@/types/auth";

interface AuthActions {
  setSession: (accessToken: string, user: AuthUser) => void;
  setAccessToken: (accessToken: string) => void;
  setAuthReady: (isAuthReady: boolean) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>()((set) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  isAuthReady: false,
  setSession: (accessToken, user) =>
    set({ accessToken, user, isAuthenticated: true, isAuthReady: true }),
  setAccessToken: (accessToken) => set({ accessToken, isAuthenticated: true }),
  setAuthReady: (isAuthReady) => set({ isAuthReady }),
  clearSession: () =>
    set({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      isAuthReady: true,
    }),
}));
