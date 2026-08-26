export const experienceQueryKeys = {
  all: ["experience"] as const,
  experiences: (admin: boolean, search?: string) =>
    [...experienceQueryKeys.all, "experiences", { admin, search }] as const,
  education: (admin: boolean, search?: string) =>
    [...experienceQueryKeys.all, "education", { admin, search }] as const,
  certifications: (admin: boolean, search?: string) =>
    [...experienceQueryKeys.all, "certifications", { admin, search }] as const,
};
