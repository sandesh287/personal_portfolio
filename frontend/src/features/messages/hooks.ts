import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { messageApi } from "./api";
import { messageQueryKeys } from "./queryKeys";
import type { MessageCreatePayload, MessageListParams, MessageUpdatePayload } from "./types";

export function useCreateMessage() {
  return useMutation({ mutationFn: (payload: MessageCreatePayload) => messageApi.create(payload) });
}

export function useMessages(params: MessageListParams) {
  return useQuery({
    queryKey: messageQueryKeys.list(params),
    queryFn: () => messageApi.list(params),
  });
}

export function useUnreadMessageCount() {
  const params = { page: 1, pageSize: 1, read: false, archived: false } as const;
  return useQuery({
    queryKey: messageQueryKeys.list(params),
    queryFn: () => messageApi.list(params),
    select: (data) => data.meta.totalItems,
    refetchInterval: 30_000,
  });
}

export function useMessage(id: string | null) {
  return useQuery({
    queryKey: messageQueryKeys.detail(id ?? ""),
    queryFn: () => messageApi.get(id ?? ""),
    enabled: Boolean(id),
  });
}

function useInboxMutation<T>(mutationFn: (payload: T) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: messageQueryKeys.all });
    },
  });
}

export function useUpdateMessage() {
  return useInboxMutation(({ id, payload }: { id: string; payload: MessageUpdatePayload }) =>
    messageApi.update(id, payload),
  );
}

export function useDeleteMessage() {
  return useInboxMutation((id: string) => messageApi.remove(id));
}
