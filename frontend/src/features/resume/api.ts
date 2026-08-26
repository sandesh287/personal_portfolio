import { env } from "@/config/env";
import { getApiData } from "@/services/api";
import { httpClient } from "@/services/httpClient";
import type { ApiResponse } from "@/types/api";

import type { ResumeUpdatePayload, ResumeUploadPayload, ResumeVersion } from "./types";

const ENDPOINT = "/resume";

export const resumeApi = {
  active() {
    return getApiData<ResumeVersion>(ENDPOINT);
  },
  versions() {
    return getApiData<ResumeVersion[]>(`${ENDPOINT}/versions`);
  },
  async upload(payload: ResumeUploadPayload) {
    const formData = new FormData();
    formData.append("file", payload.file);
    formData.append("title", payload.title);
    formData.append("version", payload.version);
    formData.append("isActive", String(payload.isActive));
    if (payload.notes) formData.append("notes", payload.notes);
    const response = await httpClient.post<ApiResponse<ResumeVersion>>(
      `${ENDPOINT}/versions`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data.data;
  },
  async update(id: string, payload: ResumeUpdatePayload) {
    const response = await httpClient.patch<ApiResponse<ResumeVersion>>(
      `${ENDPOINT}/versions/${id}`,
      payload,
    );
    return response.data.data;
  },
  async activate(id: string) {
    const response = await httpClient.post<ApiResponse<ResumeVersion>>(
      `${ENDPOINT}/versions/${id}/activate`,
    );
    return response.data.data;
  },
  async remove(id: string) {
    await httpClient.delete(`${ENDPOINT}/versions/${id}`);
  },
  downloadUrl: `${env.VITE_API_BASE_URL}${ENDPOINT}/download`,
};
