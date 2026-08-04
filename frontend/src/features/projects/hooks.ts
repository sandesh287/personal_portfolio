import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { projectsApi } from "./api";
import { projectQueryKeys } from "./queryKeys";
import type {
  AdminProjectListParams,
  FeaturedProjectsParams,
  ProjectCreatePayload,
  ProjectImageUploadPayload,
  ProjectListParams,
  ProjectUpdatePayload,
  TechnologyListParams,
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

export function useTechnologies(params?: TechnologyListParams) {
  return useQuery({
    queryKey: projectQueryKeys.technologies(params),
    queryFn: () => projectsApi.technologies(params),
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
