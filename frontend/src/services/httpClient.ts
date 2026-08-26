import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

import { env } from "@/config/env";
import type { AuthTokens } from "@/features/auth";
import { useAuthStore } from "@/stores/authStore";
import type { ApiResponse } from "@/types/api";

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let refreshRequest: Promise<AuthTokens> | null = null;

export const httpClient = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

httpClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const request = error.config as RetryableRequestConfig | undefined;
    const authState = useAuthStore.getState();
    const isTokenRequest =
      request?.url === "/auth/login" ||
      request?.url === "/auth/refresh" ||
      request?.url === "/auth/logout";

    if (
      error.response?.status !== 401 ||
      !request ||
      request._retry ||
      isTokenRequest ||
      !authState.refreshToken
    ) {
      return Promise.reject(error);
    }

    request._retry = true;

    try {
      refreshRequest ??= refreshAccessToken(authState.refreshToken);
      const tokens = await refreshRequest;
      useAuthStore.getState().setSession(tokens.accessToken, tokens.refreshToken, tokens.user);
      request.headers.Authorization = `Bearer ${tokens.accessToken}`;
      return await httpClient.request(request);
    } catch (refreshError) {
      useAuthStore.getState().clearSession();
      return Promise.reject(refreshError);
    } finally {
      refreshRequest = null;
    }
  },
);

async function refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
  const response = await axios.post<ApiResponse<AuthTokens>>(
    `${env.VITE_API_BASE_URL}/auth/refresh`,
    { refreshToken },
    { headers: { "Content-Type": "application/json" } },
  );
  return response.data.data;
}
