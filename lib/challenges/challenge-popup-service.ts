/**
 * @file challenge-popup-service.ts
 * @purpose Popup-Steuerung für Community Challenges.
 */

import type { ChallengePopupState } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import {
  userFailure,
  userSuccess,
  type UserServiceResult,
} from "@/lib/users/user-errors";

import { checkChallengeEligibility } from "./challenge-eligibility";
import type { ChallengePopupAction } from "./challenge-types";

function isPopupWithinSchedule(input: {
  popupStartAt: Date | null;
  popupEndAt: Date | null;
}): boolean {
  const now = Date.now();

  if (input.popupStartAt && input.popupStartAt.getTime() > now) {
    return false;
  }

  if (input.popupEndAt && input.popupEndAt.getTime() < now) {
    return false;
  }

  return true;
}

/**
 * Prüft, ob das Challenge-Popup einem Nutzer angezeigt werden soll.
 */
export async function shouldShowChallengePopup(
  userId: string | null | undefined,
  challengeId: string,
): Promise<boolean> {
  if (!userId?.trim()) {
    return false;
  }

  const challenge = await prisma.communityChallenge.findUnique({
    where: { id: challengeId },
  });

  if (
    !challenge ||
    !challenge.popupEnabled ||
    challenge.status !== "ACTIVE"
  ) {
    return false;
  }

  if (
    !isPopupWithinSchedule({
      popupStartAt: challenge.popupStartAt,
      popupEndAt: challenge.popupEndAt,
    })
  ) {
    return false;
  }

  const eligibility = await checkChallengeEligibility(userId, challenge);

  if (!eligibility.eligible) {
    return false;
  }

  const state = await prisma.challengeUserState.findUnique({
    where: {
      challengeId_userId: { challengeId, userId },
    },
  });

  if (!state) {
    return true;
  }

  if (state.popupState === "DISMISSED" || state.popupState === "SUBMITTED") {
    return false;
  }

  if (state.popupState === "PARTICIPATING") {
    return false;
  }

  if (state.popupState === "REMIND_LATER" && state.reminderAt) {
    return state.reminderAt.getTime() <= Date.now();
  }

  return state.popupState !== "SEEN";
}

export async function recordPopupAction(
  userId: string,
  challengeId: string,
  action: ChallengePopupAction,
): Promise<UserServiceResult<true>> {
  const challenge = await prisma.communityChallenge.findUnique({
    where: { id: challengeId },
  });

  if (!challenge) {
    return userFailure({
      code: "NOT_FOUND",
      message: "Challenge nicht gefunden.",
    });
  }

  const eligibility = await checkChallengeEligibility(userId, challenge);

  if (!eligibility.eligible) {
    return userFailure({
      code: "FORBIDDEN",
      message: eligibility.reason ?? "Keine Teilnahmeberechtigung.",
    });
  }

  const now = new Date();
  let popupState: ChallengePopupState;
  let reminderAt: Date | null = null;
  let dismissedAt: Date | null = null;

  switch (action) {
    case "SEEN":
      popupState = "SEEN";
      break;
    case "REMIND_LATER":
      popupState = "REMIND_LATER";
      reminderAt = new Date(
        now.getTime() +
          challenge.popupRemindAfterDays * 24 * 60 * 60 * 1000,
      );
      break;
    case "DISMISSED":
      popupState = "DISMISSED";
      dismissedAt = now;
      break;
    default:
      return userFailure({
        code: "VALIDATION_ERROR",
        message: "Unbekannte Popup-Aktion.",
      });
  }

  try {
    await prisma.challengeUserState.upsert({
      where: {
        challengeId_userId: { challengeId, userId },
      },
      create: {
        challengeId,
        userId,
        popupState,
        lastPopupAt: now,
        firstSeenAt: now,
        reminderAt,
        dismissedAt,
      },
      update: {
        popupState,
        lastPopupAt: now,
        firstSeenAt: now,
        reminderAt,
        dismissedAt,
      },
    });

    return userSuccess(true);
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Popup-Status konnte nicht gespeichert werden.",
    });
  }
}
