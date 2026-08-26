import { getApiData } from "@/services/api";
import { httpClient } from "@/services/httpClient";
import type { ApiResponse } from "@/types/api";
import type { AuthUser } from "@/types/auth";

import type { AuthTokens, LoginPayload } from "./types";

const AUTH_ENDPOINT = "/auth";

export const authApi = {
  async login(payload: LoginPayload) {
    const response = await httpClient.post<ApiResponse<AuthTokens>>(
      `${AUTH_ENDPOINT}/login`,
      payload,
    );
    return response.data.data;
  },

  async refresh() {
    const response = await httpClient.post<ApiResponse<AuthTokens>>(`${AUTH_ENDPOINT}/refresh`);
    return response.data.data;
  },

  currentUser() {
    return getApiData<AuthUser>(`${AUTH_ENDPOINT}/me`);
  },

  async logout() {
    const response = await httpClient.post<ApiResponse<{ loggedOut: boolean }>>(
      `${AUTH_ENDPOINT}/logout`,
    );
    return response.data.data;
  },
};
