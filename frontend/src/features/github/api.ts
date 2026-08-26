import { getApiData } from "@/services/api";
import { httpClient } from "@/services/httpClient";
import type { ApiResponse } from "@/types/api";
import { compactParams } from "@/utils/apiParams";

import type {
  GitHubActivityList,
  GitHubActivityParams,
  GitHubRepositoryList,
  GitHubRepositoryParams,
  GitHubSummary,
} from "./types";

const ENDPOINT = "/github";

export const githubApi = {
  summary() {
    return getApiData<GitHubSummary>(`${ENDPOINT}/summary`);
  },
  repositories(params: GitHubRepositoryParams) {
    return getApiData<GitHubRepositoryList>(`${ENDPOINT}/repositories`, {
      params: compactParams(params),
    });
  },
  activity(params: GitHubActivityParams) {
    return getApiData<GitHubActivityList>(`${ENDPOINT}/activity`, {
      params: compactParams(params),
    });
  },
  async sync() {
    const response = await httpClient.post<ApiResponse<{ synced: boolean; fetchedAt: string }>>(
      `${ENDPOINT}/sync`,
    );
    return response.data.data;
  },
};
