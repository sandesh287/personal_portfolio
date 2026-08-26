import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { githubApi } from "./api";
import { githubQueryKeys } from "./queryKeys";
import type { GitHubActivityParams, GitHubRepositoryParams } from "./types";

export function useGitHubSummary() {
  return useQuery({ queryKey: githubQueryKeys.summary(), queryFn: githubApi.summary });
}

export function useGitHubRepositories(params: GitHubRepositoryParams) {
  return useQuery({
    queryKey: githubQueryKeys.repositories(params),
    queryFn: () => githubApi.repositories(params),
  });
}

export function useGitHubActivity(params: GitHubActivityParams) {
  return useQuery({
    queryKey: githubQueryKeys.activity(params),
    queryFn: () => githubApi.activity(params),
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
