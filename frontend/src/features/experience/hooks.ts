import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { experienceApi } from "./api";
import { experienceQueryKeys } from "./queryKeys";
import type {
  CertificationMutationPayload,
  EducationMutationPayload,
  ExperienceMutationPayload,
} from "./types";

export function useExperiences(search?: string, admin = false) {
  return useQuery({
    queryKey: experienceQueryKeys.experiences(admin, search),
    queryFn: () => (admin ? experienceApi.listAdmin(search) : experienceApi.list(search)),
  });
}

export function useEducation(search?: string, admin = false) {
  return useQuery({
    queryKey: experienceQueryKeys.education(admin, search),
    queryFn: () =>
      admin ? experienceApi.listAdminEducation(search) : experienceApi.listEducation(search),
  });
}

export function useCertifications(search?: string, admin = false) {
  return useQuery({
    queryKey: experienceQueryKeys.certifications(admin, search),
    queryFn: () =>
      admin
        ? experienceApi.listAdminCertifications(search)
        : experienceApi.listCertifications(search),
  });
}

function useTimelineMutation<TPayload>(mutationFn: (payload: TPayload) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: experienceQueryKeys.all });
    },
  });
}

export function useCreateExperience() {
  return useTimelineMutation((payload: ExperienceMutationPayload) => experienceApi.create(payload));
}

export function useUpdateExperience(id: string) {
  return useTimelineMutation((payload: Partial<ExperienceMutationPayload>) =>
    experienceApi.update(id, payload),
  );
}

export function useDeleteExperience() {
  return useTimelineMutation((id: string) => experienceApi.remove(id));
}

export function useCreateEducation() {
  return useTimelineMutation((payload: EducationMutationPayload) =>
    experienceApi.createEducation(payload),
  );
}

export function useUpdateEducation(id: string) {
  return useTimelineMutation((payload: Partial<EducationMutationPayload>) =>
    experienceApi.updateEducation(id, payload),
  );
}

export function useDeleteEducation() {
  return useTimelineMutation((id: string) => experienceApi.removeEducation(id));
}

export function useCreateCertification() {
  return useTimelineMutation((payload: CertificationMutationPayload) =>
    experienceApi.createCertification(payload),
  );
}

export function useUpdateCertification(id: string) {
  return useTimelineMutation((payload: Partial<CertificationMutationPayload>) =>
    experienceApi.updateCertification(id, payload),
  );
}

export function useDeleteCertification() {
  return useTimelineMutation((id: string) => experienceApi.removeCertification(id));
}
