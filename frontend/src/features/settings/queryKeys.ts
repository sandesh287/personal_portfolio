export const settingsQueryKeys = {
  all: ["settings"] as const,
  public: () => [...settingsQueryKeys.all, "public"] as const,
  admin: () => [...settingsQueryKeys.all, "admin"] as const,
};
