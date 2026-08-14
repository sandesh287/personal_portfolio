import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mediaKeys } from "@/features/media/queryKeys";

import { projectsApi } from "./api";
import { projectQueryKeys } from "./queryKeys";
import type {
  AdminProjectListParams,
  FeaturedProjectsParams,
  ProjectCoverImagePayload,
  ProjectCategoryCreatePayload,
  ProjectCategoryUpdatePayload,
  ProjectCreatePayload,
  ProjectImageUploadPayload,
  ProjectImageAttachPayload,
  ProjectVideoAttachPayload,
  ProjectExternalVideoCreatePayload,
  ProjectVideoUpdatePayload,
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

export function useProjectImages(projectId: string | undefined) {
  return useQuery({
    queryKey: projectQueryKeys.images(projectId ?? ""),
    queryFn: () => projectsApi.images(projectId ?? ""),
    enabled: Boolean(projectId),
  });
}

export function useProjectVideos(projectId: string | undefined) {
  return useQuery({
    queryKey: projectQueryKeys.videos(projectId ?? ""),
    queryFn: () => projectsApi.videos(projectId ?? ""),
    enabled: Boolean(projectId),
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
    onSuccess: async (_image, payload) => {
      await queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
      await queryClient.invalidateQueries({ queryKey: projectQueryKeys.images(payload.projectId) });
      await queryClient.invalidateQueries({ queryKey: mediaKeys.all });
    },
  });
}

export function useAttachProjectImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProjectImageAttachPayload) => projectsApi.attachImage(payload),
    onSuccess: async (_image, payload) => {
      await queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
      await queryClient.invalidateQueries({ queryKey: projectQueryKeys.images(payload.projectId) });
    },
  });
}

export function useSetProjectCoverImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProjectCoverImagePayload) => projectsApi.setCoverImage(payload),
    onSuccess: async (_project, payload) => {
      await queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
      await queryClient.invalidateQueries({ queryKey: projectQueryKeys.images(payload.projectId) });
    },
  });
}

export function useDeleteProjectImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, imageId }: { projectId: string; imageId: string }) =>
      projectsApi.removeImage(projectId, imageId),
    onSuccess: async (_result, payload) => {
      await queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
      await queryClient.invalidateQueries({ queryKey: projectQueryKeys.images(payload.projectId) });
    },
  });
}

export function useAttachProjectVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProjectVideoAttachPayload) => projectsApi.attachVideo(payload),
    onSuccess: async (_video, payload) => {
      await queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
      await queryClient.invalidateQueries({ queryKey: projectQueryKeys.videos(payload.projectId) });
    },
  });
}

export function useCreateExternalProjectVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProjectExternalVideoCreatePayload) =>
      projectsApi.createExternalVideo(payload),
    onSuccess: async (_video, payload) => {
      await queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
      await queryClient.invalidateQueries({ queryKey: projectQueryKeys.videos(payload.projectId) });
    },
  });
}

export function useDeleteProjectVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, videoId }: { projectId: string; videoId: string }) =>
      projectsApi.removeVideo(projectId, videoId),
    onSuccess: async (_result, payload) => {
      await queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
      await queryClient.invalidateQueries({ queryKey: projectQueryKeys.videos(payload.projectId) });
    },
  });
}

export function useUpdateProjectVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProjectVideoUpdatePayload) => projectsApi.updateVideo(payload),
    onSuccess: async (_video, payload) => {
      await queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
      await queryClient.invalidateQueries({ queryKey: projectQueryKeys.videos(payload.projectId) });
    },
  });
}
