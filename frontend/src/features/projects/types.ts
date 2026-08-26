import type { PaginatedPayload } from "@/types/api";

export type ProjectStatus = "draft" | "published" | "archived";

export type ProjectSortField = "title" | "createdAt" | "updatedAt" | "publishedAt" | "sortOrder";

export type SortDirection = "asc" | "desc";

export interface ProjectCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
}

export interface Technology {
  id: string;
  name: string;
  slug: string;
  category: string;
  icon: string | null;
  color: string | null;
  sortOrder: number;
}

export interface ProjectImage {
  id: string;
  mediaAssetId: string;
  url: string | null;
  caption: string | null;
  sortOrder: number;
  imageWidth: number | null;
  imageHeight: number | null;
  placeholderUrl: string | null;
}

export interface ProjectVideo {
  id: string;
  mediaAssetId: string | null;
  provider: string;
  externalUrl: string | null;
  url: string | null;
  title: string | null;
  caption: string | null;
  sortOrder: number;
}

export interface ProjectVideoAttachPayload {
  projectId: string;
  mediaAssetId: string;
  title?: string | null;
  caption?: string | null;
  sortOrder?: number;
}

export interface ProjectExternalVideoCreatePayload {
  projectId: string;
  externalUrl: string;
  title?: string | null;
  caption?: string | null;
  sortOrder?: number;
}

export interface ProjectVideoUpdatePayload {
  projectId: string;
  videoId: string;
  title?: string | null;
  caption?: string | null;
  sortOrder?: number;
}

export interface ProjectImageUpdatePayload {
  projectId: string;
  imageId: string;
  caption?: string | null;
  sortOrder?: number;
}

export interface ReorderItem {
  id: string;
  sortOrder: number;
}

export interface ReorderPayload {
  projectId: string;
  items: ReorderItem[];
}

export interface Project {
  id: string;
  title: string;
  slug: string;
  summary: string;
  description: string | null;
  category: ProjectCategory | null;
  technologies: Technology[];
  images: ProjectImage[];
  videos: ProjectVideo[];
  coverImageId: string | null;
  repositoryUrl: string | null;
  liveUrl: string | null;
  caseStudyUrl: string | null;
  status: ProjectStatus;
  featured: boolean;
  sortOrder: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryId?: string;
  technologyId?: string;
  status?: ProjectStatus;
  featured?: boolean;
  sort?: ProjectSortField;
  order?: SortDirection;
}

export type AdminProjectListParams = ProjectListParams;

export interface FeaturedProjectsParams {
  limit?: number;
}

export interface TechnologyListParams {
  category?: string;
}

export interface ProjectCategoryMutationPayload {
  name: string;
  slug: string;
  description?: string | null;
  sortOrder?: number;
}

export type ProjectCategoryCreatePayload = ProjectCategoryMutationPayload;

export type ProjectCategoryUpdatePayload = Partial<ProjectCategoryMutationPayload>;

export interface TechnologyMutationPayload {
  name: string;
  slug: string;
  category: string;
  icon?: string | null;
  color?: string | null;
  sortOrder?: number;
}

export type TechnologyCreatePayload = TechnologyMutationPayload;

export type TechnologyUpdatePayload = Partial<TechnologyMutationPayload>;

export interface ProjectMutationPayload {
  title: string;
  slug: string;
  summary: string;
  description?: string | null;
  categoryId?: string | null;
  technologyIds?: string[];
  coverImageId?: string | null;
  repositoryUrl?: string | null;
  liveUrl?: string | null;
  caseStudyUrl?: string | null;
  status?: ProjectStatus;
  featured?: boolean;
  sortOrder?: number;
}

export type ProjectCreatePayload = ProjectMutationPayload;

export type ProjectUpdatePayload = Partial<ProjectMutationPayload>;

export interface ProjectImageUploadPayload {
  projectId: string;
  file: File;
  caption?: string | null;
  sortOrder?: number;
}

export interface ProjectImageAttachPayload {
  projectId: string;
  mediaAssetId: string;
  caption?: string | null;
  sortOrder?: number;
}

export interface ProjectCoverImagePayload {
  projectId: string;
  imageId: string | null;
}

export type ProjectListResponse = PaginatedPayload<Project>;
