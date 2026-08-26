import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "@/stores/authStore";

import { authApi } from "./api";
import { authQueryKeys } from "./queryKeys";
import type { LoginPayload } from "./types";

export function useLogin() {
  const queryClient = useQueryClient();
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: async (tokens) => {
      setSession(tokens.accessToken, tokens.user);
      await queryClient.invalidateQueries({ queryKey: authQueryKeys.all });
    },
  });
}

export function useRefreshSession() {
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: () => authApi.refresh(),
    onSuccess: (tokens) => {
      setSession(tokens.accessToken, tokens.user);
    },
  });
}

export function useCurrentUser(enabled: boolean) {
  return useQuery({
    queryKey: authQueryKeys.currentUser(),
    queryFn: authApi.currentUser,
    enabled,
    retry: false,
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const clearSession = useAuthStore((state) => state.clearSession);

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: async () => {
      clearSession();
      await queryClient.clear();
    },
  });
}
