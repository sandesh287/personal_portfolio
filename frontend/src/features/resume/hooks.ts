import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { resumeApi } from "./api";
import { resumeQueryKeys } from "./queryKeys";
import type { ResumeUpdatePayload, ResumeUploadPayload } from "./types";

export function useActiveResume() {
  return useQuery({ queryKey: resumeQueryKeys.active(), queryFn: resumeApi.active });
}

export function useResumeVersions() {
  return useQuery({ queryKey: resumeQueryKeys.versions(), queryFn: resumeApi.versions });
}

function useResumeMutation<T>(mutationFn: (payload: T) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: resumeQueryKeys.all });
    },
  });
}

export function useUploadResume() {
  return useResumeMutation((payload: ResumeUploadPayload) => resumeApi.upload(payload));
}

export function useUpdateResume(id: string) {
  return useResumeMutation((payload: ResumeUpdatePayload) => resumeApi.update(id, payload));
}

export function useActivateResume() {
  return useResumeMutation((id: string) => resumeApi.activate(id));
}

export function useDeleteResume() {
  return useResumeMutation((id: string) => resumeApi.remove(id));
}
