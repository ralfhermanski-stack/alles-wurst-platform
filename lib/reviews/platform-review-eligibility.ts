/**
 * @file platform-review-eligibility.ts
 */

import type { PlatformReviewEligibilityRule } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

import { getHomepageCommunityReviewsSettings } from "./homepage-reviews-settings-service";

function isDevelopmentReviewBypass(): boolean {
  return process.env.NODE_ENV === "development";
}

export async function canUserSubmitPlatformReview(userId: string): Promise<{
  allowed: boolean;
  reason: string | null;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      emailVerifiedAt: true,
      accountStatus: true,
      systemRole: true,
      deletedAt: true,
      createdAt: true,
    },
  });

  if (!user || user.deletedAt) {
    return { allowed: false, reason: "Benutzer nicht gefunden." };
  }

  if (user.systemRole !== "USER" && !isDevelopmentReviewBypass()) {
    return {
      allowed: false,
      reason: "Nur reguläre Mitglieder können eine Plattformbewertung abgeben.",
    };
  }

  if (user.accountStatus !== "active") {
    return { allowed: false, reason: "Dein Konto ist nicht aktiv." };
  }

  if (!user.emailVerifiedAt && !isDevelopmentReviewBypass()) {
    return {
      allowed: false,
      reason: "Bitte bestätige zuerst deine E-Mail-Adresse.",
    };
  }

  const settings = await getHomepageCommunityReviewsSettings();
  const rule = settings.eligibilityRule;

  if (isDevelopmentReviewBypass()) {
    return { allowed: true, reason: null };
  }

  if (rule === "days_registered") {
    const days =
      (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24);

    if (days < settings.minRegistrationDays) {
      return {
        allowed: false,
        reason: `Du kannst erst nach ${settings.minRegistrationDays} Tagen Mitgliedschaft eine Bewertung abgeben.`,
      };
    }

    return { allowed: true, reason: null };
  }

  if (rule === "course_started") {
    const started = await prisma.userCourseAccess.count({
      where: { userId },
    });

    if (started === 0) {
      return {
        allowed: false,
        reason: "Du musst mindestens einen Kurs begonnen haben.",
      };
    }

    return { allowed: true, reason: null };
  }

  if (rule === "recipe_saved") {
    const saved = await prisma.recipe.count({
      where: { userId, deletedAt: null },
    });

    if (saved === 0) {
      return {
        allowed: false,
        reason: "Du musst mindestens ein Rezept gespeichert haben.",
      };
    }

    return { allowed: true, reason: null };
  }

  if (rule === "tool_used") {
    const toolUse = await prisma.analyticsEvent.count({
      where: {
        userId,
        pagePath: { startsWith: "/werkstatt" },
      },
    });

    if (toolUse === 0) {
      return {
        allowed: false,
        reason: "Du musst mindestens ein Werkzeug genutzt haben.",
      };
    }

    return { allowed: true, reason: null };
  }

  return { allowed: true, reason: null };
}

export type { PlatformReviewEligibilityRule };
