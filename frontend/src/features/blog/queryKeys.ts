import type { AdminBlogListParams, BlogListParams, FeaturedBlogParams } from "./types";

export const blogQueryKeys = {
  all: ["blog"] as const,
  lists: () => [...blogQueryKeys.all, "list"] as const,
  list: (params?: BlogListParams) => [...blogQueryKeys.lists(), params ?? {}] as const,
  adminLists: () => [...blogQueryKeys.all, "adminList"] as const,
  adminList: (params?: AdminBlogListParams) =>
    [...blogQueryKeys.adminLists(), params ?? {}] as const,
  featured: (params?: FeaturedBlogParams) =>
    [...blogQueryKeys.all, "featured", params ?? {}] as const,
  categories: () => [...blogQueryKeys.all, "categories"] as const,
  tags: () => [...blogQueryKeys.all, "tags"] as const,
  details: () => [...blogQueryKeys.all, "detail"] as const,
  detail: (slug: string) => [...blogQueryKeys.details(), slug] as const,
  adminDetails: () => [...blogQueryKeys.all, "adminDetail"] as const,
  adminDetail: (postId: string) => [...blogQueryKeys.adminDetails(), postId] as const,
};
