import type { PaginatedPayload } from "@/types/api";

export type SkillSortField = "name" | "category" | "level" | "sortOrder";

export interface Skill {
  id: string;
  technologyId: string | null;
  name: string;
  slug: string;
  category: string;
  level: number;
  icon: string | null;
  color: string | null;
  description: string | null;
  sortOrder: number;
}

export interface SkillListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  level?: number;
  sort?: SkillSortField;
  order?: "asc" | "desc";
}

export interface SkillMutationPayload {
  technologyId?: string | null;
  name: string;
  slug: string;
  category: string;
  level: number;
  icon?: string | null;
  color?: string | null;
  description?: string | null;
  sortOrder?: number;
}

export type SkillListResponse = PaginatedPayload<Skill>;
export type GroupedSkills = Record<string, Skill[]>;
