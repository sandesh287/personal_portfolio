import { httpClient } from "@/services/httpClient";

export const api = {
  get: httpClient.get,
  post: httpClient.post,
  put: httpClient.put,
  patch: httpClient.patch,
  delete: httpClient.delete,
};
