export const resumeQueryKeys = {
  all: ["resume"] as const,
  active: () => [...resumeQueryKeys.all, "active"] as const,
  versions: () => [...resumeQueryKeys.all, "versions"] as const,
};
