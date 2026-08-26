import type { SkillListParams } from "./types";

export const skillQueryKeys = {
  all: ["skills"] as const,
  lists: () => [...skillQueryKeys.all, "list"] as const,
  list: (params?: SkillListParams) => [...skillQueryKeys.lists(), params ?? {}] as const,
  grouped: () => [...skillQueryKeys.all, "grouped"] as const,
};
