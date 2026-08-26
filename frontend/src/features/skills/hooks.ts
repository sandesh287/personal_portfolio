import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { skillApi } from "./api";
import { skillQueryKeys } from "./queryKeys";
import type { SkillListParams, SkillMutationPayload } from "./types";

export function useSkills(params?: SkillListParams) {
  return useQuery({ queryKey: skillQueryKeys.list(params), queryFn: () => skillApi.list(params) });
}

export function useGroupedSkills() {
  return useQuery({ queryKey: skillQueryKeys.grouped(), queryFn: () => skillApi.grouped() });
}

function useSkillMutation<TPayload>(mutationFn: (payload: TPayload) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: skillQueryKeys.all });
    },
  });
}

export function useCreateSkill() {
  return useSkillMutation((payload: SkillMutationPayload) => skillApi.create(payload));
}

export function useUpdateSkill(id: string) {
  return useSkillMutation((payload: Partial<SkillMutationPayload>) => skillApi.update(id, payload));
}

export function useDeleteSkill() {
  return useSkillMutation((id: string) => skillApi.remove(id));
}
