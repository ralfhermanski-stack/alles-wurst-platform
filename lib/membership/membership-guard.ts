/**
 * @file membership-guard.ts
 * @purpose Service-Hilfen für Mitgliedschaftsprüfungen in der Rezept-Schicht.
 */

import { recipeFailure, type RecipeServiceResult } from "@/lib/tools/recipe-errors";
import type { MembershipCheckResult } from "./membership-rules";

/**
 * Wandelt ein abgelehntes Membership-Ergebnis in ein Service-Failure um.
 */
export function membershipCheckToFailure(
  check: Extract<MembershipCheckResult, { allowed: false }>,
): RecipeServiceResult<never> {
  return recipeFailure({
    code: "FORBIDDEN",
    message: check.message,
    details: { capability: check.capability },
  });
}

/**
 * Gibt bei erlaubtem Zugriff null zurück, sonst ein Failure-Ergebnis.
 */
export function guardMembershipCheck(
  check: MembershipCheckResult,
): RecipeServiceResult<never> | null {
  if (check.allowed) {
    return null;
  }

  return membershipCheckToFailure(check);
}
