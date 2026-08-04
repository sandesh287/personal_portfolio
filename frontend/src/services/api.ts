import { httpClient } from "@/services/httpClient";
import type { ApiResponse } from "@/types/api";
import type { AxiosRequestConfig } from "axios";

export const api = {
  get: httpClient.get,
  post: httpClient.post,
  put: httpClient.put,
  patch: httpClient.patch,
  delete: httpClient.delete,
};

export async function getApiData<TData>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<TData> {
  const response = await httpClient.get<ApiResponse<TData>>(url, config);
  return response.data.data;
}
