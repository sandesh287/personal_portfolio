import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { settingsApi } from "./api";
import { settingsQueryKeys } from "./queryKeys";
import type { SettingsUpdatePayload } from "./types";

export function usePublicSettings() {
  return useQuery({
    queryKey: settingsQueryKeys.public(),
    queryFn: settingsApi.public,
    staleTime: 5 * 60_000,
  });
}

export function useAdminSettings() {
  return useQuery({ queryKey: settingsQueryKeys.admin(), queryFn: settingsApi.admin });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SettingsUpdatePayload) => settingsApi.update(payload),
    onSuccess: async (settings) => {
      queryClient.setQueryData(settingsQueryKeys.admin(), settings);
      queryClient.setQueryData(settingsQueryKeys.public(), settings);
      await queryClient.invalidateQueries({ queryKey: settingsQueryKeys.all });
    },
  });
}
