/**
 * @file marinade-access.ts
 * @purpose Rechteprüfung für Marinaden-Generator (Premium/Club).
 */

import type { MembershipAccessContext } from "@/lib/membership/membership-rules";
import {
  checkMembershipCapability,
  isLoggedInUser,
  type MembershipCheckResult,
} from "@/lib/membership/membership-rules";

export type MarinadeAccessLevel = "none" | "demo" | "full";

export function getMarinadeAccessLevel(
  context: MembershipAccessContext,
): MarinadeAccessLevel {
  if (!isLoggedInUser(context)) {
    return "none";
  }

  const saveCheck = checkMembershipCapability(context, "marinade.save");

  if (saveCheck.allowed) {
    return "full";
  }

  const useCheck = checkMembershipCapability(context, "marinade.use");

  if (useCheck.allowed) {
    return "demo";
  }

  return "none";
}

export function canUseMarinadeGenerator(
  context: MembershipAccessContext,
): MembershipCheckResult {
  if (!isLoggedInUser(context)) {
    return {
      allowed: false,
      capability: "marinade.use",
      message:
        "Der Marinaden-Generator ist nur für angemeldete Mitglieder verfügbar. Bitte melde dich an.",
    };
  }

  return checkMembershipCapability(context, "marinade.use");
}

export function canSaveMarinade(
  context: MembershipAccessContext,
): MembershipCheckResult {
  return checkMembershipCapability(context, "marinade.save");
}

export function canDownloadMarinadePdf(
  context: MembershipAccessContext,
): MembershipCheckResult {
  return checkMembershipCapability(context, "marinade.pdf");
}

export function canReadMarinadeRecipe(params: {
  recipeUserId: string;
  visibility: string;
  isOfficialDatabase: boolean;
  moderationStatus: string;
  requestingUserId: string | null;
  isAdmin: boolean;
  membership: MembershipAccessContext;
}): boolean {
  if (params.isAdmin) {
    return true;
  }

  if (params.requestingUserId === params.recipeUserId) {
    return true;
  }

  if (params.visibility === "private") {
    return false;
  }

  if (
    params.visibility === "database" &&
    params.isOfficialDatabase &&
    params.moderationStatus === "approved"
  ) {
    const readCheck = checkMembershipCapability(
      params.membership,
      "recipe.database.read",
    );

    return readCheck.allowed;
  }

  if (params.visibility === "public") {
    return true;
  }

  return false;
}
