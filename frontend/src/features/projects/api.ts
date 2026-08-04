import { getApiData } from "@/services/api";
import { httpClient } from "@/services/httpClient";
import type { ApiResponse } from "@/types/api";

import type {
  FeaturedProjectsParams,
  Project,
  ProjectCreatePayload,
  ProjectImage,
  ProjectImageUploadPayload,
  ProjectListParams,
  ProjectListResponse,
  ProjectCategory,
  ProjectUpdatePayload,
  Technology,
  TechnologyListParams,
} from "./types";

const PROJECTS_ENDPOINT = "/projects";

function compactParams<TParams extends object>(params?: TParams) {
  if (!params) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== ""),
  );
}

export const projectsApi = {
  list(params?: ProjectListParams) {
    return getApiData<ProjectListResponse>(PROJECTS_ENDPOINT, {
      params: compactParams(params),
    });
  },

  featured(params?: FeaturedProjectsParams) {
    return getApiData<Project[]>(`${PROJECTS_ENDPOINT}/featured`, {
      params: compactParams(params),
    });
  },

  categories() {
    return getApiData<ProjectCategory[]>(`${PROJECTS_ENDPOINT}/categories`);
  },

  technologies(params?: TechnologyListParams) {
    return getApiData<Technology[]>(`${PROJECTS_ENDPOINT}/technologies`, {
      params: compactParams(params),
    });
  },

  details(slug: string) {
    return getApiData<Project>(`${PROJECTS_ENDPOINT}/${slug}`);
  },

  async create(payload: ProjectCreatePayload) {
    const response = await httpClient.post<ApiResponse<Project>>(PROJECTS_ENDPOINT, payload);
    return response.data.data;
  },

  async update(projectId: string, payload: ProjectUpdatePayload) {
    const response = await httpClient.patch<ApiResponse<Project>>(
      `${PROJECTS_ENDPOINT}/${projectId}`,
      payload,
    );
    return response.data.data;
  },

  async remove(projectId: string) {
    const response = await httpClient.delete<ApiResponse<{ deleted: boolean }>>(
      `${PROJECTS_ENDPOINT}/${projectId}`,
    );
    return response.data.data;
  },

  async uploadImage({ projectId, file, caption, sortOrder = 0 }: ProjectImageUploadPayload) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("sortOrder", String(sortOrder));

    if (caption) {
      formData.append("caption", caption);
    }

    const response = await httpClient.post<ApiResponse<ProjectImage>>(
      `${PROJECTS_ENDPOINT}/${projectId}/images`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return response.data.data;
  },
};
