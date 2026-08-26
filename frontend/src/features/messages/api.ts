import { getApiData } from "@/services/api";
import { httpClient } from "@/services/httpClient";
import type { ApiResponse } from "@/types/api";
import { compactParams } from "@/utils/apiParams";

import type {
  ContactMessage,
  MessageCreatePayload,
  MessageListParams,
  MessageListResponse,
  MessageReceipt,
  MessageUpdatePayload,
} from "./types";

const ENDPOINT = "/messages";

export const messageApi = {
  async create(payload: MessageCreatePayload) {
    const response = await httpClient.post<ApiResponse<MessageReceipt>>(ENDPOINT, payload);
    return response.data.data;
  },
  list(params: MessageListParams) {
    return getApiData<MessageListResponse>(ENDPOINT, { params: compactParams(params) });
  },
  get(id: string) {
    return getApiData<ContactMessage>(`${ENDPOINT}/${id}`);
  },
  async update(id: string, payload: MessageUpdatePayload) {
    const response = await httpClient.patch<ApiResponse<ContactMessage>>(
      `${ENDPOINT}/${id}`,
      payload,
    );
    return response.data.data;
  },
  async remove(id: string) {
    await httpClient.delete(`${ENDPOINT}/${id}`);
  },
};
