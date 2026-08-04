import { httpClient } from "@/services/httpClient";
import type { ApiResponse } from "@/types/api";

export const api = {
  get: httpClient.get,
  post: httpClient.post,
  put: httpClient.put,
  patch: httpClient.patch,
  delete: httpClient.delete,
};

export async function getApiData<TData>(url: string): Promise<TData> {
  const response = await httpClient.get<ApiResponse<TData>>(url);
  return response.data.data;
}
