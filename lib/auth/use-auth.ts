"use client";

/**
 * @file use-auth.ts
 * @purpose Client-Hook für Session und Logout.
 */

import { useCallback, useEffect, useState } from "react";

import { fetchSessionApi, logoutApi } from "@/lib/auth/auth-client";
import type { AuthSessionUser } from "@/lib/auth/auth-types";
import { clearRecipeUserId, setRecipeUserId } from "@/lib/tools/recipe-session";

export type AuthState = {
  user: AuthSessionUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

export function useAuth(): AuthState {
  const [user, setUser] = useState<AuthSessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const response = await fetchSessionApi();

    if (response.success) {
      setUser(response.data);

      if (response.data) {
        setRecipeUserId(response.data.id);
      }
    } else {
      setUser(null);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      const response = await fetchSessionApi();

      if (cancelled) {
        return;
      }

      if (response.success) {
        setUser(response.data);

        if (response.data) {
          setRecipeUserId(response.data.id);
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    }

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const logout = useCallback(async () => {
    await logoutApi();
    clearRecipeUserId();
    setUser(null);
  }, []);

  return { user, loading, refresh, logout };
}
