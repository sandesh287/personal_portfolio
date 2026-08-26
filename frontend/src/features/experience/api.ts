import { getApiData } from "@/services/api";
import { httpClient } from "@/services/httpClient";
import type { ApiResponse } from "@/types/api";
import { compactParams } from "@/utils/apiParams";

import type {
  Education,
  EducationMutationPayload,
  Experience,
  ExperienceMutationPayload,
} from "./types";

const ENDPOINT = "/experience";

export const experienceApi = {
  list(search?: string) {
    return getApiData<Experience[]>(ENDPOINT, { params: compactParams({ search }) });
  },
  listAdmin(search?: string) {
    return getApiData<Experience[]>(`${ENDPOINT}/admin`, {
      params: compactParams({ search }),
    });
  },
  listEducation(search?: string) {
    return getApiData<Education[]>(`${ENDPOINT}/education`, {
      params: compactParams({ search }),
    });
  },
  listAdminEducation(search?: string) {
    return getApiData<Education[]>(`${ENDPOINT}/admin/education`, {
      params: compactParams({ search }),
    });
  },
  async create(payload: ExperienceMutationPayload) {
    const response = await httpClient.post<ApiResponse<Experience>>(`${ENDPOINT}/admin`, payload);
    return response.data.data;
  },
  async update(id: string, payload: Partial<ExperienceMutationPayload>) {
    const response = await httpClient.patch<ApiResponse<Experience>>(
      `${ENDPOINT}/admin/${id}`,
      payload,
    );
    return response.data.data;
  },
  async remove(id: string) {
    await httpClient.delete(`${ENDPOINT}/admin/${id}`);
  },
  async createEducation(payload: EducationMutationPayload) {
    const response = await httpClient.post<ApiResponse<Education>>(
      `${ENDPOINT}/admin/education`,
      payload,
    );
    return response.data.data;
  },
  async updateEducation(id: string, payload: Partial<EducationMutationPayload>) {
    const response = await httpClient.patch<ApiResponse<Education>>(
      `${ENDPOINT}/admin/education/${id}`,
      payload,
    );
    return response.data.data;
  },
  async removeEducation(id: string) {
    await httpClient.delete(`${ENDPOINT}/admin/education/${id}`);
  },
};
