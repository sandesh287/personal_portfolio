import type { GitHubActivityParams, GitHubRepositoryParams } from "./types";

export const githubQueryKeys = {
  all: ["github"] as const,
  summary: () => [...githubQueryKeys.all, "summary"] as const,
  repositories: (params: GitHubRepositoryParams) =>
    [...githubQueryKeys.all, "repositories", params] as const,
  activity: (params: GitHubActivityParams) => [...githubQueryKeys.all, "activity", params] as const,
};
