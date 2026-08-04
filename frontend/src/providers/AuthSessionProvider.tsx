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
      if (!state.refreshToken) {
        state.setAuthReady(true);
        return;
      }

      try {
        if (state.accessToken) {
          await authApi.currentUser();
          state.setAuthReady(true);
          return;
        }

        const tokens = await authApi.refresh({ refreshToken: state.refreshToken });
        state.setSession(tokens.accessToken, tokens.refreshToken, tokens.user);
      } catch {
        state.clearSession();
      }
    }

    void bootstrapSession();
  }, []);

  return children;
}
