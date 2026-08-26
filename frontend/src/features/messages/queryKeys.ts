import type { MessageListParams } from "./types";

export const messageQueryKeys = {
  all: ["messages"] as const,
  lists: () => [...messageQueryKeys.all, "list"] as const,
  list: (params: MessageListParams) => [...messageQueryKeys.lists(), params] as const,
  details: () => [...messageQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...messageQueryKeys.details(), id] as const,
};
