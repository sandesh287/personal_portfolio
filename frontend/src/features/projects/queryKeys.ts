import type {
  AdminProjectListParams,
  FeaturedProjectsParams,
  ProjectListParams,
  TechnologyListParams,
} from "./types";

export const projectQueryKeys = {
  all: ["projects"] as const,
  lists: () => [...projectQueryKeys.all, "list"] as const,
  list: (params?: ProjectListParams) => [...projectQueryKeys.lists(), params ?? {}] as const,
  adminLists: () => [...projectQueryKeys.all, "adminList"] as const,
  adminList: (params?: AdminProjectListParams) =>
    [...projectQueryKeys.adminLists(), params ?? {}] as const,
  featured: (params?: FeaturedProjectsParams) =>
    [...projectQueryKeys.all, "featured", params ?? {}] as const,
  categories: () => [...projectQueryKeys.all, "categories"] as const,
  technologies: (params?: TechnologyListParams) =>
    [...projectQueryKeys.all, "technologies", params ?? {}] as const,
  details: () => [...projectQueryKeys.all, "detail"] as const,
  detail: (slug: string) => [...projectQueryKeys.details(), slug] as const,
};
