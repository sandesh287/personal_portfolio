import { createContext } from "react";

import type { AuthState, AuthUser } from "@/types/auth";

export interface AuthContextValue extends AuthState {
  setSession: (accessToken: string, refreshToken: string, user: AuthUser) => void;
  setAccessToken: (accessToken: string) => void;
  setAuthReady: (isAuthReady: boolean) => void;
  clearSession: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
