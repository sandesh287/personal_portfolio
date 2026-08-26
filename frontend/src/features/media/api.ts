import { getApiData } from "@/services/api";
import { httpClient } from "@/services/httpClient";
import type { ApiResponse, PaginatedPayload } from "@/types/api";
import { compactParams } from "@/utils/apiParams";
import type { MediaAsset, MediaAssetCreate, MediaAssetListParams, MediaAssetUpdate } from "./types";

const MEDIA_ENDPOINT = "/media";

export const mediaApi = {
  async list(params: MediaAssetListParams): Promise<PaginatedPayload<MediaAsset>> {
    const response = await httpClient.get<ApiResponse<PaginatedPayload<MediaAsset>>>(
      MEDIA_ENDPOINT,
      { params: compactParams(params) },
    );
    return response.data.data;
  },

  async get(id: string): Promise<MediaAsset> {
    return getApiData<MediaAsset>(`${MEDIA_ENDPOINT}/${id}`);
  },

  async upload(data: MediaAssetCreate): Promise<MediaAsset> {
    const formData = new FormData();
    formData.append("file", data.file);
    if (data.altText) {
      formData.append("altText", data.altText);
    }
    if (data.folder) {
      formData.append("folder", data.folder);
    }

    const response = await httpClient.post<ApiResponse<MediaAsset>>(MEDIA_ENDPOINT, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data.data;
  },

  async update(id: string, data: MediaAssetUpdate): Promise<MediaAsset> {
    const response = await httpClient.patch<ApiResponse<MediaAsset>>(
      `${MEDIA_ENDPOINT}/${id}`,
      data,
    );
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await httpClient.delete(`${MEDIA_ENDPOINT}/${id}`);
  },
};
