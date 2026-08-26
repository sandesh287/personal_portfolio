import { getApiData } from "@/services/api";
import { httpClient } from "@/services/httpClient";
import type { ApiResponse } from "@/types/api";
import { compactParams } from "@/utils/apiParams";

import type {
  Education,
  EducationMutationPayload,
  Certification,
  CertificationMutationPayload,
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
  listCertifications(search?: string) {
    return getApiData<Certification[]>(`${ENDPOINT}/certifications`, { params: { search } });
  },
  listAdminCertifications(search?: string) {
    return getApiData<Certification[]>(`${ENDPOINT}/admin/certifications`, {
      params: { search },
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
  async createCertification(payload: CertificationMutationPayload) {
    const response = await httpClient.post<ApiResponse<Certification>>(
      `${ENDPOINT}/admin/certifications`,
      payload,
    );
    return response.data.data;
  },
  async updateCertification(id: string, payload: Partial<CertificationMutationPayload>) {
    const response = await httpClient.patch<ApiResponse<Certification>>(
      `${ENDPOINT}/admin/certifications/${id}`,
      payload,
    );
    return response.data.data;
  },
  async removeCertification(id: string) {
    await httpClient.delete(`${ENDPOINT}/admin/certifications/${id}`);
  },
};
