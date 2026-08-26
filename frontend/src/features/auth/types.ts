import type { AuthUser } from "@/types/auth";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  tokenType: "bearer";
  expiresIn: number;
  user: AuthUser;
}
