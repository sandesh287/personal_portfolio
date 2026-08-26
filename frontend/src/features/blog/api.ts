import { getApiData } from "@/services/api";
import { httpClient } from "@/services/httpClient";
import type { ApiResponse } from "@/types/api";
import { compactParams } from "@/utils/apiParams";

import type {
  AdminBlogListParams,
  BlogCategory,
  BlogCategoryCreatePayload,
  BlogCategoryUpdatePayload,
  BlogListParams,
  BlogListResponse,
  BlogPost,
  BlogPostCreatePayload,
  BlogPostSummary,
  BlogPostUpdatePayload,
  BlogTag,
  BlogTagCreatePayload,
  BlogTagUpdatePayload,
  FeaturedBlogParams,
} from "./types";

const BLOG_ENDPOINT = "/blog";

export const blogApi = {
  list(params?: BlogListParams) {
    return getApiData<BlogListResponse>(BLOG_ENDPOINT, { params: compactParams(params) });
  },

  adminList(params?: AdminBlogListParams) {
    return getApiData<BlogListResponse>(`${BLOG_ENDPOINT}/admin`, {
      params: compactParams(params),
    });
  },

  featured(params?: FeaturedBlogParams) {
    return getApiData<BlogPostSummary[]>(`${BLOG_ENDPOINT}/featured`, {
      params: compactParams(params),
    });
  },

  details(slug: string) {
    return getApiData<BlogPost>(`${BLOG_ENDPOINT}/${slug}`);
  },

  adminDetails(postId: string) {
    return getApiData<BlogPost>(`${BLOG_ENDPOINT}/admin/${postId}`);
  },

  categories() {
    return getApiData<BlogCategory[]>(`${BLOG_ENDPOINT}/categories`);
  },

  tags() {
    return getApiData<BlogTag[]>(`${BLOG_ENDPOINT}/tags`);
  },

  async create(payload: BlogPostCreatePayload) {
    const response = await httpClient.post<ApiResponse<BlogPost>>(BLOG_ENDPOINT, payload);
    return response.data.data;
  },

  async update(postId: string, payload: BlogPostUpdatePayload) {
    const response = await httpClient.patch<ApiResponse<BlogPost>>(
      `${BLOG_ENDPOINT}/admin/${postId}`,
      payload,
    );
    return response.data.data;
  },

  async remove(postId: string) {
    const response = await httpClient.delete<ApiResponse<{ deleted: boolean }>>(
      `${BLOG_ENDPOINT}/admin/${postId}`,
    );
    return response.data.data;
  },

  async createCategory(payload: BlogCategoryCreatePayload) {
    const response = await httpClient.post<ApiResponse<BlogCategory>>(
      `${BLOG_ENDPOINT}/categories`,
      payload,
    );
    return response.data.data;
  },

  async updateCategory(categoryId: string, payload: BlogCategoryUpdatePayload) {
    const response = await httpClient.patch<ApiResponse<BlogCategory>>(
      `${BLOG_ENDPOINT}/categories/${categoryId}`,
      payload,
    );
    return response.data.data;
  },

  async removeCategory(categoryId: string) {
    const response = await httpClient.delete<ApiResponse<{ deleted: boolean }>>(
      `${BLOG_ENDPOINT}/categories/${categoryId}`,
    );
    return response.data.data;
  },

  async createTag(payload: BlogTagCreatePayload) {
    const response = await httpClient.post<ApiResponse<BlogTag>>(`${BLOG_ENDPOINT}/tags`, payload);
    return response.data.data;
  },

  async updateTag(tagId: string, payload: BlogTagUpdatePayload) {
    const response = await httpClient.patch<ApiResponse<BlogTag>>(
      `${BLOG_ENDPOINT}/tags/${tagId}`,
      payload,
    );
    return response.data.data;
  },

  async removeTag(tagId: string) {
    const response = await httpClient.delete<ApiResponse<{ deleted: boolean }>>(
      `${BLOG_ENDPOINT}/tags/${tagId}`,
    );
    return response.data.data;
  },
};
