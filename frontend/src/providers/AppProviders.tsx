import type { ReactNode } from "react";

import { AuthProvider } from "@/contexts/AuthContext";
import { AuthSessionProvider } from "@/providers/AuthSessionProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { ToastProvider } from "@/providers/ToastProvider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryProvider>
          <AuthSessionProvider>
            <ToastProvider>{children}</ToastProvider>
          </AuthSessionProvider>
        </QueryProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
