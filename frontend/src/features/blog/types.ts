import type { PaginatedPayload } from "@/types/api";

export type BlogStatus = "draft" | "published" | "archived";
export type BlogSortField = "title" | "createdAt" | "updatedAt" | "publishedAt";
export type SortDirection = "asc" | "desc";

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
}

export interface BlogTag {
  id: string;
  name: string;
  slug: string;
  color: string | null;
}

export interface BlogCoverImage {
  id: string;
  publicUrl: string | null;
  altText: string | null;
  imageWidth: number | null;
  imageHeight: number | null;
  placeholderUrl: string | null;
}

export interface BlogPostSummary {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: BlogCategory | null;
  tags: BlogTag[];
  coverImage: BlogCoverImage | null;
  status: BlogStatus;
  featured: boolean;
  readingTimeMinutes: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BlogPost extends BlogPostSummary {
  content: string;
  seoTitle: string | null;
  seoDescription: string | null;
}

export interface BlogListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  tag?: string;
  featured?: boolean;
  sort?: BlogSortField;
  order?: SortDirection;
}

export interface AdminBlogListParams extends BlogListParams {
  status?: BlogStatus;
}

export interface FeaturedBlogParams {
  limit?: number;
}

export interface BlogPostMutationPayload {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  categoryId?: string | null;
  coverImageId?: string | null;
  tagIds?: string[];
  status?: BlogStatus;
  featured?: boolean;
  readingTimeMinutes?: number;
  seoTitle?: string | null;
  seoDescription?: string | null;
  publishedAt?: string | null;
}

export type BlogPostCreatePayload = BlogPostMutationPayload;
export type BlogPostUpdatePayload = Partial<BlogPostMutationPayload>;

export interface BlogCategoryMutationPayload {
  name: string;
  slug: string;
  description?: string | null;
  sortOrder?: number;
}

export type BlogCategoryCreatePayload = BlogCategoryMutationPayload;
export type BlogCategoryUpdatePayload = Partial<BlogCategoryMutationPayload>;

export interface BlogTagMutationPayload {
  name: string;
  slug: string;
  color?: string | null;
}

export type BlogTagCreatePayload = BlogTagMutationPayload;
export type BlogTagUpdatePayload = Partial<BlogTagMutationPayload>;
export type BlogListResponse = PaginatedPayload<BlogPostSummary>;
