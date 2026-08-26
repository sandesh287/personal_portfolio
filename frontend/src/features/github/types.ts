import type { PaginatedPayload } from "@/types/api";

export interface GitHubProfile {
  username: string;
  name: string | null;
  avatarUrl: string;
  profileUrl: string;
  bio: string | null;
  location: string | null;
  company: string | null;
  blogUrl: string | null;
  followers: number;
  following: number;
  publicRepositories: number;
}

export interface GitHubRepository {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  homepageUrl: string | null;
  language: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  topics: string[];
  archived: boolean;
  fork: boolean;
  defaultBranch: string;
  pushedAt: string | null;
  updatedAt: string;
}

export interface GitHubActivity {
  id: string;
  type: string;
  repositoryName: string;
  repositoryUrl: string;
  action: string;
  summary: string;
  createdAt: string;
}

export interface GitHubSummary {
  profile: GitHubProfile;
  featuredRepositories: GitHubRepository[];
  recentActivity: GitHubActivity[];
  stats: {
    totalStars: number;
    totalForks: number;
    recentEvents: number;
    recentCommits: number;
  };
  fetchedAt: string;
  stale: boolean;
}

export interface GitHubRepositoryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  language?: string;
  sort?: "updatedAt" | "pushedAt" | "stars" | "forks" | "name";
  order?: "asc" | "desc";
}

export interface GitHubActivityParams {
  page?: number;
  pageSize?: number;
  type?: string;
}

export type GitHubRepositoryList = PaginatedPayload<GitHubRepository>;
export type GitHubActivityList = PaginatedPayload<GitHubActivity>;
