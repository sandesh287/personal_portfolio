import { z } from "zod";

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().url().default("http://localhost:8000/api/v1"),
  VITE_APP_NAME: z.string().default("Sandesh Developer Workspace"),
});

export const env = envSchema.parse(import.meta.env);
