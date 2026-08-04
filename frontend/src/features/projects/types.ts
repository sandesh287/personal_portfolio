import type { PaginatedPayload } from "@/types/api";

export type ProjectStatus = "draft" | "published" | "archived";

export type ProjectSortField =
  | "title"
  | "createdAt"
  | "updatedAt"
  | "publishedAt"
  | "sortOrder";

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
}

export interface ProjectVideo {
  id: string;
  mediaAssetId: string | null;
  provider: string;
  externalUrl: string | null;
  title: string | null;
  caption: string | null;
  sortOrder: number;
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

export interface FeaturedProjectsParams {
  limit?: number;
}

export interface TechnologyListParams {
  category?: string;
}

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

export type ProjectListResponse = PaginatedPayload<Project>;
