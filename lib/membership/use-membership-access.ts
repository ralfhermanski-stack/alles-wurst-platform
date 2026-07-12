"use client";

/**
 * @file useMembershipAccess.ts
 * @purpose Client-Hook für Mitgliedschaftsregeln und Sperrhinweise.
 */

import { useCallback, useEffect, useState } from "react";

import {
  canCreateOwnRecipe,
  checkMembershipCapability,
  DEFAULT_MEMBERSHIP_ROLE,
  formatRecipeLimitHint,
  getRecipeOwnLimit,
  type MembershipAccessContext,
  type MembershipCapability,
  type MembershipCheckResult,
  type MembershipRole,
} from "@/lib/membership/membership-rules";
import {
  getMembershipRole,
  isMembershipAccessBlocked,
} from "@/lib/membership/membership-session";
import { fetchSessionApi } from "@/lib/auth/auth-client";
import { getRecipeUserId } from "@/lib/tools/recipe-session";

export type MembershipAccessState = {
  role: MembershipRole;
  userId: string;
  accessBlocked: boolean;
  context: MembershipAccessContext;
  recipeLimit: number | null;
  refresh: () => void;
  check: (capability: MembershipCapability) => MembershipCheckResult;
  canCreateRecipe: (currentCount: number) => MembershipCheckResult;
  limitHint: (currentCount: number) => string | null;
};

/**
 * Liefert den aktuellen Mitgliedschaftskontext aus localStorage (Prototyp).
 */
export function useMembershipAccess(): MembershipAccessState {
  const [role, setRole] = useState<MembershipRole>(DEFAULT_MEMBERSHIP_ROLE);
  const [accessBlocked, setAccessBlocked] = useState(false);
  const [userId, setUserId] = useState("");

  const refresh = useCallback(() => {
    void (async () => {
      const sessionResponse = await fetchSessionApi();

      if (sessionResponse.success && sessionResponse.data?.membership) {
        setRole(sessionResponse.data.membership.role);
        setAccessBlocked(sessionResponse.data.membership.accessBlocked);
        setUserId(sessionResponse.data.id);
        return;
      }

      setRole(getMembershipRole());
      setAccessBlocked(isMembershipAccessBlocked());
      setUserId(getRecipeUserId());
    })();
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (
        event.key === "alles-wurst-membership-role" ||
        event.key === "alles-wurst-membership-access-blocked" ||
        event.key === "alles-wurst-recipe-user-id"
      ) {
        refresh();
      }
    }

    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("storage", onStorage);
    };
  }, [refresh]);

  const context: MembershipAccessContext = {
    role,
    userId: userId || null,
    accessBlocked,
  };

  return {
    role,
    userId,
    accessBlocked,
    context,
    recipeLimit: getRecipeOwnLimit(role),
    refresh,
    check: (capability) => checkMembershipCapability(context, capability),
    canCreateRecipe: (currentCount) =>
      canCreateOwnRecipe(context, currentCount),
    limitHint: (currentCount) => formatRecipeLimitHint(role, currentCount),
  };
}
