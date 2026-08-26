import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { githubApi } from "./api";
import { githubQueryKeys } from "./queryKeys";
import type { GitHubActivityParams, GitHubRepositoryParams } from "./types";

export function useGitHubSummary(enabled = true) {
  return useQuery({ queryKey: githubQueryKeys.summary(), queryFn: githubApi.summary, enabled });
}

export function useGitHubRepositories(params: GitHubRepositoryParams, enabled = true) {
  return useQuery({
    queryKey: githubQueryKeys.repositories(params),
    queryFn: () => githubApi.repositories(params),
    enabled,
  });
}

export function useGitHubActivity(params: GitHubActivityParams, enabled = true) {
  return useQuery({
    queryKey: githubQueryKeys.activity(params),
    queryFn: () => githubApi.activity(params),
    enabled,
  });
}

export function useSyncGitHub() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: githubApi.sync,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: githubQueryKeys.all });
    },
  });
}
