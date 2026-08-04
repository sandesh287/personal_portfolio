import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { projectsApi } from "./api";
import { projectQueryKeys } from "./queryKeys";
import type {
  AdminProjectListParams,
  FeaturedProjectsParams,
  ProjectCategoryCreatePayload,
  ProjectCategoryUpdatePayload,
  ProjectCreatePayload,
  ProjectImageUploadPayload,
  ProjectListParams,
  ProjectUpdatePayload,
  TechnologyCreatePayload,
  TechnologyListParams,
  TechnologyUpdatePayload,
} from "./types";

export function useProjects(params?: ProjectListParams) {
  return useQuery({
    queryKey: projectQueryKeys.list(params),
    queryFn: () => projectsApi.list(params),
  });
}

export function useAdminProjects(params?: AdminProjectListParams) {
  return useQuery({
    queryKey: projectQueryKeys.adminList(params),
    queryFn: () => projectsApi.adminList(params),
  });
}

export function useFeaturedProjects(params?: FeaturedProjectsParams) {
  return useQuery({
    queryKey: projectQueryKeys.featured(params),
    queryFn: () => projectsApi.featured(params),
  });
}

export function useProjectCategories() {
  return useQuery({
    queryKey: projectQueryKeys.categories(),
    queryFn: () => projectsApi.categories(),
  });
}

export function useCreateProjectCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProjectCategoryCreatePayload) => projectsApi.createCategory(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectQueryKeys.categories() });
      await queryClient.invalidateQueries({ queryKey: projectQueryKeys.adminLists() });
      await queryClient.invalidateQueries({ queryKey: projectQueryKeys.lists() });
    },
  });
}

export function useUpdateProjectCategory(categoryId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProjectCategoryUpdatePayload) =>
      projectsApi.updateCategory(categoryId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectQueryKeys.categories() });
      await queryClient.invalidateQueries({ queryKey: projectQueryKeys.adminLists() });
      await queryClient.invalidateQueries({ queryKey: projectQueryKeys.lists() });
    },
  });
}

export function useDeleteProjectCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categoryId: string) => projectsApi.removeCategory(categoryId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectQueryKeys.categories() });
      await queryClient.invalidateQueries({ queryKey: projectQueryKeys.adminLists() });
      await queryClient.invalidateQueries({ queryKey: projectQueryKeys.lists() });
    },
  });
}

export function useTechnologies(params?: TechnologyListParams) {
  return useQuery({
    queryKey: projectQueryKeys.technologies(params),
    queryFn: () => projectsApi.technologies(params),
  });
}

export function useCreateTechnology() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: TechnologyCreatePayload) => projectsApi.createTechnology(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectQueryKeys.technologies() });
      await queryClient.invalidateQueries({ queryKey: projectQueryKeys.adminLists() });
      await queryClient.invalidateQueries({ queryKey: projectQueryKeys.lists() });
    },
  });
}

export function useUpdateTechnology(technologyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: TechnologyUpdatePayload) =>
      projectsApi.updateTechnology(technologyId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectQueryKeys.technologies() });
      await queryClient.invalidateQueries({ queryKey: projectQueryKeys.adminLists() });
      await queryClient.invalidateQueries({ queryKey: projectQueryKeys.lists() });
    },
  });
}

export function useDeleteTechnology() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (technologyId: string) => projectsApi.removeTechnology(technologyId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectQueryKeys.technologies() });
      await queryClient.invalidateQueries({ queryKey: projectQueryKeys.adminLists() });
      await queryClient.invalidateQueries({ queryKey: projectQueryKeys.lists() });
    },
  });
}

export function useProjectDetails(slug: string | undefined) {
  return useQuery({
    queryKey: projectQueryKeys.detail(slug ?? ""),
    queryFn: () => projectsApi.details(slug ?? ""),
    enabled: Boolean(slug),
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProjectCreatePayload) => projectsApi.create(payload),
    onSuccess: async (project) => {
      await queryClient.invalidateQueries({ queryKey: projectQueryKeys.lists() });
      await queryClient.invalidateQueries({ queryKey: projectQueryKeys.adminLists() });
      await queryClient.invalidateQueries({ queryKey: projectQueryKeys.featured() });
      queryClient.setQueryData(projectQueryKeys.detail(project.slug), project);
    },
  });
}

export function useUpdateProject(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProjectUpdatePayload) => projectsApi.update(projectId, payload),
    onSuccess: async (project) => {
      await queryClient.invalidateQueries({ queryKey: projectQueryKeys.lists() });
      await queryClient.invalidateQueries({ queryKey: projectQueryKeys.adminLists() });
      await queryClient.invalidateQueries({ queryKey: projectQueryKeys.featured() });
      queryClient.setQueryData(projectQueryKeys.detail(project.slug), project);
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) => projectsApi.remove(projectId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    },
  });
}

export function useUploadProjectImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProjectImageUploadPayload) => projectsApi.uploadImage(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    },
  });
}
