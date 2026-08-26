import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

import { authApi } from "@/features/auth";
import { useAuthStore } from "@/stores/authStore";

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const hasBootstrapped = useRef(false);

  useEffect(() => {
    if (hasBootstrapped.current) {
      return;
    }

    hasBootstrapped.current = true;
    const state = useAuthStore.getState();

    async function bootstrapSession() {
      try {
        if (state.accessToken) {
          await authApi.currentUser();
          state.setAuthReady(true);
          return;
        }

        window.localStorage.removeItem("sandesh-admin-auth");
        const tokens = await authApi.refresh();
        state.setSession(tokens.accessToken, tokens.user);
      } catch {
        state.clearSession();
      }
    }

    void bootstrapSession();
  }, []);

  return children;
}
