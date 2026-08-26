import { getApiData } from "@/services/api";
import { httpClient } from "@/services/httpClient";
import type { ApiResponse } from "@/types/api";

import type { PublicSettings, SettingsUpdatePayload } from "./types";

const ENDPOINT = "/settings";

export const settingsApi = {
  public() {
    return getApiData<PublicSettings>(`${ENDPOINT}/public`);
  },
  admin() {
    return getApiData<PublicSettings>(ENDPOINT);
  },
  async update(payload: SettingsUpdatePayload) {
    const response = await httpClient.patch<ApiResponse<PublicSettings>>(ENDPOINT, payload);
    return response.data.data;
  },
};
