import type { FeaturedProjectsParams, ProjectListParams } from "./types";

export const projectQueryKeys = {
  all: ["projects"] as const,
  lists: () => [...projectQueryKeys.all, "list"] as const,
  list: (params?: ProjectListParams) => [...projectQueryKeys.lists(), params ?? {}] as const,
  featured: (params?: FeaturedProjectsParams) =>
    [...projectQueryKeys.all, "featured", params ?? {}] as const,
  details: () => [...projectQueryKeys.all, "detail"] as const,
  detail: (slug: string) => [...projectQueryKeys.details(), slug] as const,
};
