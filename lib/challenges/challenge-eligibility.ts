/**
 * @file challenge-eligibility.ts
 * @purpose Teilnahmeberechtigung für Community Challenges.
 */

import type { CommunityChallenge } from "@prisma/client";

import { hasActiveCourseAccess } from "@/lib/courses/course-access-service";
import { getUserMembershipRole } from "@/lib/help/help-membership";
import type { MembershipRole } from "@/lib/membership/membership-rules";
import { isStaffRole } from "@/lib/membership/membership-rules";

import {
  type ChallengeEligibilityConfig,
  type ChallengeEligibilityResult,
  type ChallengeEligibilityRole,
} from "./challenge-types";

const ROLE_RANK: Record<MembershipRole, number> = {
  guest: 0,
  registered: 1,
  wurstclub: 2,
  meisterclub: 3,
  accounting: 1,
  admin: 4,
};

const ELIGIBILITY_ROLE_RANK: Record<ChallengeEligibilityRole, number> = {
  registered: 1,
  wurstclub: 2,
  meisterclub: 3,
};

export function parseEligibilityConfig(
  value: unknown,
): ChallengeEligibilityConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const raw = value as Record<string, unknown>;
  const roles = Array.isArray(raw.roles)
    ? raw.roles.filter(
        (role): role is ChallengeEligibilityRole =>
          role === "registered" ||
          role === "wurstclub" ||
          role === "meisterclub",
      )
    : undefined;

  const courseIds = Array.isArray(raw.courseIds)
    ? raw.courseIds.filter((id): id is string => typeof id === "string" && id.trim().length > 0)
    : undefined;

  return {
    roles: roles && roles.length > 0 ? roles : undefined,
    courseIds: courseIds && courseIds.length > 0 ? courseIds : undefined,
    requireAllCourses:
      typeof raw.requireAllCourses === "boolean"
        ? raw.requireAllCourses
        : undefined,
  };
}

function roleMeetsRequirement(
  userRole: MembershipRole,
  requiredRole: ChallengeEligibilityRole,
): boolean {
  if (userRole === "admin") {
    return true;
  }

  return ROLE_RANK[userRole] >= ELIGIBILITY_ROLE_RANK[requiredRole];
}

async function hasRequiredCourseAccess(
  userId: string,
  config: ChallengeEligibilityConfig,
): Promise<boolean> {
  if (!config.courseIds || config.courseIds.length === 0) {
    return false;
  }

  const checks = await Promise.all(
    config.courseIds.map((courseId) => hasActiveCourseAccess(userId, courseId)),
  );

  if (config.requireAllCourses) {
    return checks.every(Boolean);
  }

  return checks.some(Boolean);
}

function hasRequiredMembershipRole(
  userRole: MembershipRole,
  config: ChallengeEligibilityConfig,
): boolean {
  const requiredRoles = config.roles ?? ["registered"];

  return requiredRoles.some((requiredRole) =>
    roleMeetsRequirement(userRole, requiredRole),
  );
}

type ChallengeEligibilitySource = Pick<CommunityChallenge, "eligibilityConfig">;

/**
 * Prüft, ob ein Nutzer an einer Challenge teilnehmen darf.
 */
export async function checkChallengeEligibility(
  userId: string | null | undefined,
  challenge: ChallengeEligibilitySource,
): Promise<ChallengeEligibilityResult> {
  if (!userId?.trim()) {
    return {
      eligible: false,
      reason: "Bitte melde dich an, um an der Challenge teilzunehmen.",
    };
  }

  const config = parseEligibilityConfig(challenge.eligibilityConfig);
  const userRole = await getUserMembershipRole(userId);

  if (isStaffRole(userRole) && userRole !== "accounting") {
    return { eligible: true };
  }

  const roleEligible = hasRequiredMembershipRole(userRole, config);
  const courseEligible = await hasRequiredCourseAccess(userId, config);

  if (config.courseIds && config.courseIds.length > 0 && config.roles?.length) {
    if (roleEligible || courseEligible) {
      return { eligible: true };
    }

    return {
      eligible: false,
      reason:
        "Diese Challenge ist für bestimmte Mitgliedsstufen oder Kurs-Teilnehmer reserviert.",
    };
  }

  if (config.courseIds && config.courseIds.length > 0) {
    if (courseEligible) {
      return { eligible: true };
    }

    return {
      eligible: false,
      reason: "Für diese Challenge benötigst du Zugriff auf den erforderlichen Kurs.",
    };
  }

  if (roleEligible) {
    return { eligible: true };
  }

  if (userRole === "guest") {
    return {
      eligible: false,
      reason: "Bitte melde dich an, um an der Challenge teilzunehmen.",
    };
  }

  const requiredRoles = config.roles ?? ["registered"];
  const needsMeisterclub = requiredRoles.includes("meisterclub");
  const needsWurstclub = requiredRoles.includes("wurstclub");

  if (needsMeisterclub) {
    return {
      eligible: false,
      reason: "Diese Challenge ist Meisterclub-Mitgliedern vorbehalten.",
    };
  }

  if (needsWurstclub) {
    return {
      eligible: false,
      reason: "Diese Challenge ist Wurst-Club-Mitgliedern vorbehalten.",
    };
  }

  return {
    eligible: false,
    reason: "Du erfüllst die Teilnahmevoraussetzungen für diese Challenge nicht.",
  };
}
