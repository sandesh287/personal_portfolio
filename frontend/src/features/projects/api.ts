import { getApiData } from "@/services/api";
import { httpClient } from "@/services/httpClient";
import type { ApiResponse } from "@/types/api";
import { compactParams } from "@/utils/apiParams";

import type {
  AdminProjectListParams,
  FeaturedProjectsParams,
  Project,
  ProjectCoverImagePayload,
  ProjectCreatePayload,
  ProjectImage,
  ProjectImageAttachPayload,
  ProjectImageUpdatePayload,
  ProjectImageUploadPayload,
  ProjectVideo,
  ProjectVideoAttachPayload,
  ProjectExternalVideoCreatePayload,
  ProjectVideoUpdatePayload,
  ReorderPayload,
  ProjectListParams,
  ProjectListResponse,
  ProjectCategory,
  ProjectCategoryCreatePayload,
  ProjectCategoryUpdatePayload,
  ProjectUpdatePayload,
  Technology,
  TechnologyCreatePayload,
  TechnologyListParams,
  TechnologyUpdatePayload,
} from "./types";

const PROJECTS_ENDPOINT = "/projects";

export const projectsApi = {
  list(params?: ProjectListParams) {
    return getApiData<ProjectListResponse>(PROJECTS_ENDPOINT, {
      params: compactParams(params),
    });
  },

  adminList(params?: AdminProjectListParams) {
    return getApiData<ProjectListResponse>(`${PROJECTS_ENDPOINT}/admin`, {
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

  async createCategory(payload: ProjectCategoryCreatePayload) {
    const response = await httpClient.post<ApiResponse<ProjectCategory>>(
      `${PROJECTS_ENDPOINT}/categories`,
      payload,
    );
    return response.data.data;
  },

  async updateCategory(categoryId: string, payload: ProjectCategoryUpdatePayload) {
    const response = await httpClient.patch<ApiResponse<ProjectCategory>>(
      `${PROJECTS_ENDPOINT}/categories/${categoryId}`,
      payload,
    );
    return response.data.data;
  },

  async removeCategory(categoryId: string) {
    const response = await httpClient.delete<ApiResponse<{ deleted: boolean }>>(
      `${PROJECTS_ENDPOINT}/categories/${categoryId}`,
    );
    return response.data.data;
  },

  async createTechnology(payload: TechnologyCreatePayload) {
    const response = await httpClient.post<ApiResponse<Technology>>(
      `${PROJECTS_ENDPOINT}/technologies`,
      payload,
    );
    return response.data.data;
  },

  async updateTechnology(technologyId: string, payload: TechnologyUpdatePayload) {
    const response = await httpClient.patch<ApiResponse<Technology>>(
      `${PROJECTS_ENDPOINT}/technologies/${technologyId}`,
      payload,
    );
    return response.data.data;
  },

  async removeTechnology(technologyId: string) {
    const response = await httpClient.delete<ApiResponse<{ deleted: boolean }>>(
      `${PROJECTS_ENDPOINT}/technologies/${technologyId}`,
    );
    return response.data.data;
  },

  details(slug: string) {
    return getApiData<Project>(`${PROJECTS_ENDPOINT}/${slug}`);
  },

  images(projectId: string) {
    return getApiData<ProjectImage[]>(`${PROJECTS_ENDPOINT}/${projectId}/images`);
  },

  videos(projectId: string) {
    return getApiData<ProjectVideo[]>(`${PROJECTS_ENDPOINT}/${projectId}/videos`);
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

  async attachImage({
    projectId,
    mediaAssetId,
    caption,
    sortOrder = 0,
  }: ProjectImageAttachPayload) {
    const response = await httpClient.post<ApiResponse<ProjectImage>>(
      `${PROJECTS_ENDPOINT}/${projectId}/images/attach`,
      { mediaAssetId, caption, sortOrder },
    );
    return response.data.data;
  },

  async setCoverImage({ projectId, imageId }: ProjectCoverImagePayload) {
    const response = await httpClient.patch<ApiResponse<Project>>(
      `${PROJECTS_ENDPOINT}/${projectId}/cover-image`,
      { imageId },
    );
    return response.data.data;
  },

  async attachVideo({ projectId, ...payload }: ProjectVideoAttachPayload) {
    const response = await httpClient.post<ApiResponse<ProjectVideo>>(
      `${PROJECTS_ENDPOINT}/${projectId}/videos/attach`,
      payload,
    );
    return response.data.data;
  },

  async createExternalVideo({ projectId, ...payload }: ProjectExternalVideoCreatePayload) {
    const response = await httpClient.post<ApiResponse<ProjectVideo>>(
      `${PROJECTS_ENDPOINT}/${projectId}/videos/external`,
      payload,
    );
    return response.data.data;
  },

  async removeVideo(projectId: string, videoId: string) {
    const response = await httpClient.delete<ApiResponse<{ deleted: boolean }>>(
      `${PROJECTS_ENDPOINT}/${projectId}/videos/${videoId}`,
    );
    return response.data.data;
  },

  async updateVideo({ projectId, videoId, ...payload }: ProjectVideoUpdatePayload) {
    const response = await httpClient.patch<ApiResponse<ProjectVideo>>(
      `${PROJECTS_ENDPOINT}/${projectId}/videos/${videoId}`,
      payload,
    );
    return response.data.data;
  },

  async updateImage({ projectId, imageId, ...payload }: ProjectImageUpdatePayload) {
    const response = await httpClient.patch<ApiResponse<ProjectImage>>(
      `${PROJECTS_ENDPOINT}/${projectId}/images/${imageId}`,
      payload,
    );
    return response.data.data;
  },

  async reorderImages({ projectId, items }: ReorderPayload) {
    const response = await httpClient.patch<ApiResponse<ProjectImage[]>>(
      `${PROJECTS_ENDPOINT}/${projectId}/images/reorder`,
      { items },
    );
    return response.data.data;
  },

  async reorderVideos({ projectId, items }: ReorderPayload) {
    const response = await httpClient.patch<ApiResponse<ProjectVideo[]>>(
      `${PROJECTS_ENDPOINT}/${projectId}/videos/reorder`,
      { items },
    );
    return response.data.data;
  },

  async removeImage(projectId: string, imageId: string) {
    const response = await httpClient.delete<ApiResponse<{ deleted: boolean }>>(
      `${PROJECTS_ENDPOINT}/${projectId}/images/${imageId}`,
    );
    return response.data.data;
  },
};
