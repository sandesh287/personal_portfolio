import { getApiData } from "@/services/api";
import { httpClient } from "@/services/httpClient";
import type { ApiResponse } from "@/types/api";
import type { AuthUser } from "@/types/auth";

import type { AuthTokens, LoginPayload, LogoutPayload, RefreshTokenPayload } from "./types";

const AUTH_ENDPOINT = "/auth";

export const authApi = {
  async login(payload: LoginPayload) {
    const response = await httpClient.post<ApiResponse<AuthTokens>>(
      `${AUTH_ENDPOINT}/login`,
      payload,
    );
    return response.data.data;
  },

  async refresh(payload: RefreshTokenPayload) {
    const response = await httpClient.post<ApiResponse<AuthTokens>>(
      `${AUTH_ENDPOINT}/refresh`,
      payload,
    );
    return response.data.data;
  },

  currentUser() {
    return getApiData<AuthUser>(`${AUTH_ENDPOINT}/me`);
  },

  async logout(payload: LogoutPayload) {
    const response = await httpClient.post<ApiResponse<{ deleted: boolean }>>(
      `${AUTH_ENDPOINT}/logout`,
      payload,
    );
    return response.data.data;
  },
};
