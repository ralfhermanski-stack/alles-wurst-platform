/**
 * @file challenge-test-data-service.ts
 * @purpose Testdaten für Challenges (nur Dev/Staging).
 */

import { prisma } from "@/lib/db/prisma";
import {
  userFailure,
  userSuccess,
  type UserServiceResult,
} from "@/lib/users/user-errors";

import { isNonProductionEnvironment } from "../social-media/social-media-env-check";

export const TEST_CHALLENGE_SLUG = "test-challenge-meine-erste-bratwurst";
export const TEST_CHALLENGE_TITLE = "Test-Challenge – Meine erste Bratwurst";

export type TestDataSummary = {
  socialChannels: number;
  socialPosts: number;
  challenges: number;
  submissions: number;
};

function guardNonProduction(): UserServiceResult<never> | null {
  if (!isNonProductionEnvironment()) {
    return userFailure({
      code: "FORBIDDEN",
      message: "Testdatenfunktionen sind in der Produktion nicht verfügbar.",
    });
  }

  return null;
}

export async function listTestDataSummary(): Promise<TestDataSummary> {
  const [socialChannels, socialPosts, challenges, submissions] =
    await Promise.all([
      prisma.socialMediaChannel.count({ where: { isTestData: true } }),
      prisma.socialMediaPost.count({ where: { isTestData: true } }),
      prisma.communityChallenge.count({ where: { isTestData: true } }),
      prisma.challengeSubmission.count({ where: { isTestData: true } }),
    ]);

  return { socialChannels, socialPosts, challenges, submissions };
}

export async function createTestChallenge(
  adminUserId: string,
): Promise<UserServiceResult<{ id: string; slug: string }>> {
  const denied = guardNonProduction();

  if (denied) {
    return denied;
  }

  const existing = await prisma.communityChallenge.findUnique({
    where: { slug: TEST_CHALLENGE_SLUG },
  });

  if (existing) {
    return userSuccess({ id: existing.id, slug: existing.slug });
  }

  const now = new Date();
  const endAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const challenge = await prisma.communityChallenge.create({
    data: {
      title: TEST_CHALLENGE_TITLE,
      slug: TEST_CHALLENGE_SLUG,
      excerpt: "Testdaten — nur für Einrichtung und Prüfung.",
      description:
        "Diese Challenge ist als Test markiert und dient der Einrichtungsprüfung.",
      task: "Lade ein Foto deiner ersten selbstgemachten Bratwurst hoch.",
      startAt: now,
      endAt,
      submissionDeadline: endAt,
      status: "ACTIVE",
      eligibilityConfig: { roles: ["registered"] },
      participationRules:
        "Test-Challenge — bitte nach Abschluss der Prüfung löschen.",
      showOnHomepage: true,
      showInMemberDashboard: true,
      popupEnabled: true,
      popupStartAt: now,
      popupEndAt: endAt,
      notificationsEnabled: true,
      isTestData: true,
      createdById: adminUserId,
      publishedById: adminUserId,
      publishedAt: now,
    },
  });

  return userSuccess({ id: challenge.id, slug: challenge.slug });
}

export async function deleteAllChallengeTestData(): Promise<
  UserServiceResult<{ deletedChallenges: number; deletedSubmissions: number }>
> {
  const denied = guardNonProduction();

  if (denied) {
    return denied;
  }

  const deletedSubmissions = await prisma.challengeSubmission.deleteMany({
    where: { isTestData: true },
  });

  const deletedChallenges = await prisma.communityChallenge.deleteMany({
    where: { isTestData: true },
  });

  return userSuccess({
    deletedChallenges: deletedChallenges.count,
    deletedSubmissions: deletedSubmissions.count,
  });
}

export async function deleteAllSocialTestData(): Promise<
  UserServiceResult<{ deletedChannels: number; deletedPosts: number }>
> {
  const denied = guardNonProduction();

  if (denied) {
    return denied;
  }

  const deletedPosts = await prisma.socialMediaPost.deleteMany({
    where: { isTestData: true },
  });

  const deletedChannels = await prisma.socialMediaChannel.deleteMany({
    where: { isTestData: true },
  });

  return userSuccess({
    deletedChannels: deletedChannels.count,
    deletedPosts: deletedPosts.count,
  });
}

export async function createTestSubmissions(
  challengeId: string,
  userIds: string[],
): Promise<UserServiceResult<{ created: number }>> {
  const denied = guardNonProduction();

  if (denied) {
    return denied;
  }

  const challenge = await prisma.communityChallenge.findUnique({
    where: { id: challengeId },
  });

  if (!challenge?.isTestData) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: "Testeinreichungen sind nur für markierte Test-Challenges erlaubt.",
    });
  }

  let created = 0;

  for (const userId of userIds) {
    const existing = await prisma.challengeSubmission.findUnique({
      where: {
        challengeId_userId: { challengeId, userId },
      },
    });

    if (existing) {
      continue;
    }

    await prisma.challengeSubmission.create({
      data: {
        challengeId,
        userId,
        title: "Test-Einreichung",
        description: "Automatisch angelegte Testeinreichung.",
        status: "DRAFT",
        isTestData: true,
      },
    });

    created += 1;
  }

  return userSuccess({ created });
}
