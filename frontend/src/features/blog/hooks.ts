import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { blogApi } from "./api";
import { blogQueryKeys } from "./queryKeys";
import type {
  AdminBlogListParams,
  BlogCategoryCreatePayload,
  BlogCategoryUpdatePayload,
  BlogListParams,
  BlogPostCreatePayload,
  BlogPostUpdatePayload,
  BlogTagCreatePayload,
  BlogTagUpdatePayload,
  FeaturedBlogParams,
} from "./types";

export function useBlogPosts(params?: BlogListParams) {
  return useQuery({
    queryKey: blogQueryKeys.list(params),
    queryFn: () => blogApi.list(params),
  });
}

export function useAdminBlogPosts(params?: AdminBlogListParams) {
  return useQuery({
    queryKey: blogQueryKeys.adminList(params),
    queryFn: () => blogApi.adminList(params),
  });
}

export function useFeaturedBlogPosts(params?: FeaturedBlogParams) {
  return useQuery({
    queryKey: blogQueryKeys.featured(params),
    queryFn: () => blogApi.featured(params),
  });
}

export function useBlogPost(slug: string | undefined) {
  return useQuery({
    queryKey: blogQueryKeys.detail(slug ?? ""),
    queryFn: () => blogApi.details(slug ?? ""),
    enabled: Boolean(slug),
  });
}

export function useAdminBlogPost(postId: string | undefined) {
  return useQuery({
    queryKey: blogQueryKeys.adminDetail(postId ?? ""),
    queryFn: () => blogApi.adminDetails(postId ?? ""),
    enabled: Boolean(postId),
  });
}

export function useBlogCategories() {
  return useQuery({
    queryKey: blogQueryKeys.categories(),
    queryFn: () => blogApi.categories(),
  });
}

export function useBlogTags() {
  return useQuery({
    queryKey: blogQueryKeys.tags(),
    queryFn: () => blogApi.tags(),
  });
}

export function useCreateBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BlogPostCreatePayload) => blogApi.create(payload),
    onSuccess: async (post) => {
      await queryClient.invalidateQueries({ queryKey: blogQueryKeys.all });
      queryClient.setQueryData(blogQueryKeys.detail(post.slug), post);
      queryClient.setQueryData(blogQueryKeys.adminDetail(post.id), post);
    },
  });
}

export function useUpdateBlogPost(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BlogPostUpdatePayload) => blogApi.update(postId, payload),
    onSuccess: async (post) => {
      await queryClient.invalidateQueries({ queryKey: blogQueryKeys.all });
      queryClient.setQueryData(blogQueryKeys.detail(post.slug), post);
      queryClient.setQueryData(blogQueryKeys.adminDetail(post.id), post);
    },
  });
}

export function useDeleteBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => blogApi.remove(postId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: blogQueryKeys.all });
    },
  });
}

export function useCreateBlogCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BlogCategoryCreatePayload) => blogApi.createCategory(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: blogQueryKeys.all });
    },
  });
}

export function useUpdateBlogCategory(categoryId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BlogCategoryUpdatePayload) => blogApi.updateCategory(categoryId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: blogQueryKeys.all });
    },
  });
}

export function useDeleteBlogCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categoryId: string) => blogApi.removeCategory(categoryId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: blogQueryKeys.all });
    },
  });
}

export function useCreateBlogTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BlogTagCreatePayload) => blogApi.createTag(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: blogQueryKeys.all });
    },
  });
}

export function useUpdateBlogTag(tagId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BlogTagUpdatePayload) => blogApi.updateTag(tagId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: blogQueryKeys.all });
    },
  });
}

export function useDeleteBlogTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tagId: string) => blogApi.removeTag(tagId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: blogQueryKeys.all });
    },
  });
}
