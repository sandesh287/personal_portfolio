import { isAxiosError } from "axios";

import type { ApiResponse } from "@/types/api";

export function getErrorMessage(error: unknown, fallback = "Something went wrong.") {
  if (isAxiosError<ApiResponse<unknown>>(error)) {
    return error.response?.data.message ?? error.message ?? fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
