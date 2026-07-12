/**
 * @file challenge-service.ts
 * @purpose Community Challenges: CRUD, Status, Homepage-Daten.
 */

import type {
  CommunityChallenge,
  CommunityChallengeStatus,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import {
  userFailure,
  userSuccess,
  type UserServiceResult,
} from "@/lib/users/user-errors";
import { getPublicUserName } from "@/lib/users/public-user";
import { buildPublicAvatarUrl } from "@/lib/users/user-avatar-storage";

import { parseEligibilityConfig } from "./challenge-eligibility";
import {
  buildChallengeMediaPublicUrl,
} from "./challenge-media-storage";
import {
  parseSubmissionConfig,
} from "./challenge-submission-service";
import type {
  ChallengeEntry,
  ChallengeSubmissionPreview,
  HomepageChallengeData,
  UpsertChallengeInput,
} from "./challenge-types";

const ACTIVE_HOMEPAGE_STATUSES: CommunityChallengeStatus[] = [
  "ACTIVE",
  "VOTING",
];

const PARTICIPANT_STATUSES = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
  "WINNER",
] as const;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[äÄ]/g, "ae")
    .replace(/[öÖ]/g, "oe")
    .replace(/[üÜ]/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function parseDate(value: string, fieldLabel: string): Date | null {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function toChallengeEntry(
  challenge: CommunityChallenge & {
    _count?: {
      submissions: number;
    };
    approvedSubmissionCount?: number;
  },
): ChallengeEntry {
  return {
    id: challenge.id,
    title: challenge.title,
    slug: challenge.slug,
    excerpt: challenge.excerpt,
    description: challenge.description,
    task: challenge.task,
    coverImageUrl: challenge.coverImageUrl,
    startAt: challenge.startAt.toISOString(),
    endAt: challenge.endAt.toISOString(),
    submissionDeadline: challenge.submissionDeadline.toISOString(),
    votingStartAt: challenge.votingStartAt?.toISOString() ?? null,
    votingEndAt: challenge.votingEndAt?.toISOString() ?? null,
    status: challenge.status,
    eligibilityConfig: parseEligibilityConfig(challenge.eligibilityConfig),
    participationRules: challenge.participationRules,
    submissionConfig: parseSubmissionConfig(challenge.submissionConfig),
    votingMode: challenge.votingMode,
    winnerCount: challenge.winnerCount,
    prizeDescription: challenge.prizeDescription,
    showOnHomepage: challenge.showOnHomepage,
    showInMemberDashboard: challenge.showInMemberDashboard,
    popupEnabled: challenge.popupEnabled,
    popupStartAt: challenge.popupStartAt?.toISOString() ?? null,
    popupEndAt: challenge.popupEndAt?.toISOString() ?? null,
    popupRemindAfterDays: challenge.popupRemindAfterDays,
    notificationsEnabled: challenge.notificationsEnabled,
    forumId: challenge.forumId,
    forumThreadId: challenge.forumThreadId,
    createdById: challenge.createdById,
    publishedById: challenge.publishedById,
    publishedAt: challenge.publishedAt?.toISOString() ?? null,
    isTestData: challenge.isTestData,
    createdAt: challenge.createdAt.toISOString(),
    updatedAt: challenge.updatedAt.toISOString(),
    submissionCount: challenge._count?.submissions,
    approvedSubmissionCount: challenge.approvedSubmissionCount,
  };
}

function validateChallengeDates(input: UpsertChallengeInput): string | null {
  const startAt = parseDate(input.startAt, "Startdatum");
  const endAt = parseDate(input.endAt, "Enddatum");
  const submissionDeadline = parseDate(
    input.submissionDeadline,
    "Einreichungsfrist",
  );

  if (!startAt || !endAt || !submissionDeadline) {
    return "Ungültige Datumsangaben.";
  }

  if (endAt.getTime() < startAt.getTime()) {
    return "Das Enddatum muss nach dem Startdatum liegen.";
  }

  if (submissionDeadline.getTime() > endAt.getTime()) {
    return "Die Einreichungsfrist darf nicht nach dem Enddatum liegen.";
  }

  if (input.votingStartAt) {
    const votingStartAt = parseDate(input.votingStartAt, "Abstimmungsstart");

    if (!votingStartAt) {
      return "Ungültiges Abstimmungsstart-Datum.";
    }
  }

  if (input.votingEndAt) {
    const votingEndAt = parseDate(input.votingEndAt, "Abstimmungsende");

    if (!votingEndAt) {
      return "Ungültiges Abstimmungsende-Datum.";
    }
  }

  return null;
}

function buildChallengeCreateData(
  input: UpsertChallengeInput,
): Prisma.CommunityChallengeCreateInput | null {
  const title = input.title.trim();
  const description = input.description.trim();
  const task = input.task.trim();
  const startAt = parseDate(input.startAt, "Startdatum");
  const endAt = parseDate(input.endAt, "Enddatum");
  const submissionDeadline = parseDate(
    input.submissionDeadline,
    "Einreichungsfrist",
  );

  if (!title || !description || !task || !startAt || !endAt || !submissionDeadline) {
    return null;
  }

  const slug = slugify(input.slug?.trim() || title);

  if (!slug) {
    return null;
  }

  return {
    title,
    slug,
    excerpt: input.excerpt?.trim() || null,
    description,
    task,
    coverImageUrl: input.coverImageUrl?.trim() || null,
    startAt,
    endAt,
    submissionDeadline,
    votingStartAt: input.votingStartAt
      ? parseDate(input.votingStartAt, "Abstimmungsstart")
      : null,
    votingEndAt: input.votingEndAt
      ? parseDate(input.votingEndAt, "Abstimmungsende")
      : null,
    status: input.status ?? "DRAFT",
    eligibilityConfig: (input.eligibilityConfig ?? {}) as Prisma.InputJsonValue,
    participationRules: input.participationRules?.trim() || null,
    submissionConfig: (input.submissionConfig ?? {}) as Prisma.InputJsonValue,
    votingMode: input.votingMode ?? "ADMIN_ONLY",
    winnerCount: input.winnerCount ?? 1,
    prizeDescription: input.prizeDescription?.trim() || null,
    showOnHomepage: input.showOnHomepage ?? true,
    showInMemberDashboard: input.showInMemberDashboard ?? true,
    popupEnabled: input.popupEnabled ?? false,
    popupStartAt: input.popupStartAt
      ? parseDate(input.popupStartAt, "Popup-Start")
      : null,
    popupEndAt: input.popupEndAt
      ? parseDate(input.popupEndAt, "Popup-Ende")
      : null,
    popupRemindAfterDays: input.popupRemindAfterDays ?? 3,
    notificationsEnabled: input.notificationsEnabled ?? true,
    ...(input.forumId
      ? { forum: { connect: { id: input.forumId } } }
      : {}),
    forumThreadId: input.forumThreadId ?? null,
    createdById: input.createdById ?? null,
  };
}

export async function getActiveHomepageChallenge(): Promise<ChallengeEntry | null> {
  const now = new Date();

  const challenge = await prisma.communityChallenge.findFirst({
    where: {
      isTestData: false,
      showOnHomepage: true,
      status: { in: ACTIVE_HOMEPAGE_STATUSES },
      startAt: { lte: now },
      endAt: { gte: now },
    },
    orderBy: [{ startAt: "desc" }],
    include: {
      _count: {
        select: {
          submissions: {
            where: { status: { in: [...PARTICIPANT_STATUSES] } },
          },
        },
      },
    },
  });

  if (!challenge) {
    return null;
  }

  const approvedSubmissionCount = await prisma.challengeSubmission.count({
    where: { challengeId: challenge.id, status: "APPROVED" },
  });

  return toChallengeEntry({
    ...challenge,
    approvedSubmissionCount,
  });
}

export async function getChallengeById(
  id: string,
): Promise<UserServiceResult<ChallengeEntry>> {
  const challenge = await prisma.communityChallenge.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          submissions: true,
        },
      },
    },
  });

  if (!challenge) {
    return userFailure({
      code: "NOT_FOUND",
      message: "Challenge nicht gefunden.",
    });
  }

  const approvedSubmissionCount = await prisma.challengeSubmission.count({
    where: { challengeId: challenge.id, status: "APPROVED" },
  });

  return userSuccess(
    toChallengeEntry({
      ...challenge,
      approvedSubmissionCount,
    }),
  );
}

export async function getChallengeBySlug(
  slug: string,
): Promise<ChallengeEntry | null> {
  const challenge = await prisma.communityChallenge.findUnique({
    where: { slug },
    include: {
      _count: {
        select: {
          submissions: {
            where: { status: { in: [...PARTICIPANT_STATUSES] } },
          },
        },
      },
    },
  });

  if (!challenge) {
    return null;
  }

  const approvedSubmissionCount = await prisma.challengeSubmission.count({
    where: { challengeId: challenge.id, status: "APPROVED" },
  });

  return toChallengeEntry({
    ...challenge,
    approvedSubmissionCount,
  });
}

export async function listAdminChallenges(): Promise<ChallengeEntry[]> {
  const challenges = await prisma.communityChallenge.findMany({
    orderBy: [{ updatedAt: "desc" }],
    include: {
      _count: {
        select: {
          submissions: true,
        },
      },
    },
  });

  const approvedCounts = await prisma.challengeSubmission.groupBy({
    by: ["challengeId"],
    where: { status: "APPROVED" },
    _count: { _all: true },
  });
  const approvedMap = new Map(
    approvedCounts.map((row) => [row.challengeId, row._count._all]),
  );

  return challenges.map((challenge) =>
    toChallengeEntry({
      ...challenge,
      approvedSubmissionCount: approvedMap.get(challenge.id) ?? 0,
    }),
  );
}

export async function listPublicChallenges(): Promise<ChallengeEntry[]> {
  const challenges = await prisma.communityChallenge.findMany({
    where: {
      status: { in: ["ACTIVE", "VOTING", "COMPLETED"] },
    },
    orderBy: [{ startAt: "desc" }],
  });

  return challenges.map((challenge) => toChallengeEntry(challenge));
}

export async function createChallenge(
  input: UpsertChallengeInput,
): Promise<UserServiceResult<ChallengeEntry>> {
  const dateError = validateChallengeDates(input);

  if (dateError) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: dateError,
    });
  }

  const data = buildChallengeCreateData(input);

  if (!data) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: "Titel, Beschreibung und Aufgabe sind erforderlich.",
    });
  }

  try {
    const challenge = await prisma.communityChallenge.create({
      data,
    });

    return userSuccess(toChallengeEntry(challenge));
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Challenge konnte nicht erstellt werden.",
    });
  }
}

export async function updateChallenge(
  id: string,
  input: UpsertChallengeInput,
): Promise<UserServiceResult<ChallengeEntry>> {
  const existing = await prisma.communityChallenge.findUnique({
    where: { id },
  });

  if (!existing) {
    return userFailure({
      code: "NOT_FOUND",
      message: "Challenge nicht gefunden.",
    });
  }

  const dateError = validateChallengeDates(input);

  if (dateError) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: dateError,
    });
  }

  const title = input.title.trim();
  const description = input.description.trim();
  const task = input.task.trim();
  const startAt = parseDate(input.startAt, "Startdatum");
  const endAt = parseDate(input.endAt, "Enddatum");
  const submissionDeadline = parseDate(
    input.submissionDeadline,
    "Einreichungsfrist",
  );

  if (!title || !description || !task || !startAt || !endAt || !submissionDeadline) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: "Titel, Beschreibung und Aufgabe sind erforderlich.",
    });
  }

  try {
    const challenge = await prisma.communityChallenge.update({
      where: { id },
      data: {
        title,
        slug: slugify(input.slug?.trim() || title),
        excerpt: input.excerpt?.trim() || null,
        description,
        task,
        coverImageUrl: input.coverImageUrl?.trim() || null,
        startAt,
        endAt,
        submissionDeadline,
        votingStartAt: input.votingStartAt
          ? parseDate(input.votingStartAt, "Abstimmungsstart")
          : null,
        votingEndAt: input.votingEndAt
          ? parseDate(input.votingEndAt, "Abstimmungsende")
          : null,
        status: input.status ?? existing.status,
        eligibilityConfig: (input.eligibilityConfig ??
          parseEligibilityConfig(existing.eligibilityConfig)) as Prisma.InputJsonValue,
        participationRules: input.participationRules?.trim() || null,
        submissionConfig: (input.submissionConfig ??
          parseSubmissionConfig(existing.submissionConfig)) as Prisma.InputJsonValue,
        votingMode: input.votingMode ?? existing.votingMode,
        winnerCount: input.winnerCount ?? existing.winnerCount,
        prizeDescription: input.prizeDescription?.trim() || null,
        showOnHomepage: input.showOnHomepage ?? existing.showOnHomepage,
        showInMemberDashboard:
          input.showInMemberDashboard ?? existing.showInMemberDashboard,
        popupEnabled: input.popupEnabled ?? existing.popupEnabled,
        popupStartAt: input.popupStartAt
          ? parseDate(input.popupStartAt, "Popup-Start")
          : null,
        popupEndAt: input.popupEndAt
          ? parseDate(input.popupEndAt, "Popup-Ende")
          : null,
        popupRemindAfterDays:
          input.popupRemindAfterDays ?? existing.popupRemindAfterDays,
        notificationsEnabled:
          input.notificationsEnabled ?? existing.notificationsEnabled,
        ...(input.forumId !== undefined
          ? input.forumId
            ? { forum: { connect: { id: input.forumId } } }
            : { forum: { disconnect: true } }
          : {}),
        forumThreadId: input.forumThreadId ?? existing.forumThreadId,
      },
    });

    return userSuccess(toChallengeEntry(challenge));
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Challenge konnte nicht gespeichert werden.",
    });
  }
}

export async function publishChallenge(
  id: string,
  userId: string,
): Promise<UserServiceResult<ChallengeEntry>> {
  const existing = await prisma.communityChallenge.findUnique({
    where: { id },
  });

  if (!existing) {
    return userFailure({
      code: "NOT_FOUND",
      message: "Challenge nicht gefunden.",
    });
  }

  if (existing.status !== "DRAFT" && existing.status !== "SCHEDULED") {
    return userFailure({
      code: "CONFLICT",
      message: "Nur Entwürfe oder geplante Challenges können veröffentlicht werden.",
    });
  }

  const now = new Date();
  const nextStatus: CommunityChallengeStatus =
    existing.startAt.getTime() > now.getTime() ? "SCHEDULED" : "ACTIVE";

  try {
    const challenge = await prisma.communityChallenge.update({
      where: { id },
      data: {
        status: nextStatus,
        publishedAt: now,
        publishedById: userId,
      },
    });

    return userSuccess(toChallengeEntry(challenge));
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Challenge konnte nicht veröffentlicht werden.",
    });
  }
}

export async function processChallengeStatusTransitions(): Promise<{
  activated: number;
  movedToVoting: number;
  completed: number;
}> {
  const now = new Date();

  const [activated, movedToVoting, completed] = await Promise.all([
    prisma.communityChallenge.updateMany({
      where: {
        status: "SCHEDULED",
        startAt: { lte: now },
      },
      data: { status: "ACTIVE" },
    }),
    prisma.communityChallenge.updateMany({
      where: {
        status: "ACTIVE",
        votingStartAt: { lte: now },
        OR: [{ votingEndAt: null }, { votingEndAt: { gt: now } }],
      },
      data: { status: "VOTING" },
    }),
    prisma.communityChallenge.updateMany({
      where: {
        status: { in: ["ACTIVE", "VOTING"] },
        OR: [
          { votingEndAt: { lte: now } },
          {
            votingEndAt: null,
            endAt: { lte: now },
          },
        ],
      },
      data: { status: "COMPLETED" },
    }),
  ]);

  return {
    activated: activated.count,
    movedToVoting: movedToVoting.count,
    completed: completed.count,
  };
}

async function loadApprovedSubmissionPreviews(
  challengeId: string,
  limit: number,
): Promise<ChallengeSubmissionPreview[]> {
  const submissions = await prisma.challengeSubmission.findMany({
    where: {
      challengeId,
      isTestData: false,
      status: "APPROVED",
      media: { some: { mediaType: "image" } },
    },
    include: {
      user: {
        select: {
          id: true,
          profile: {
            select: {
              publicName: true,
              firstName: true,
              avatarUrl: true,
            },
          },
        },
      },
      media: {
        where: { mediaType: "image" },
        orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
        take: 1,
      },
    },
    orderBy: [{ submittedAt: "desc" }, { createdAt: "desc" }],
    take: limit,
  });

  return submissions
    .filter((submission) => submission.media.length > 0)
    .map((submission) => ({
      id: submission.id,
      title: submission.title,
      description: submission.description,
      displayName: getPublicUserName(submission.user),
      avatarUrl: submission.user.profile?.avatarUrl
        ? buildPublicAvatarUrl(submission.user.id)
        : null,
      previewImageUrl: buildChallengeMediaPublicUrl(submission.media[0].id),
      submittedAt: submission.submittedAt?.toISOString() ?? null,
    }));
}

export async function getHomepageChallengeData(
  previewLimit = 8,
): Promise<HomepageChallengeData> {
  const challenge = await getActiveHomepageChallenge();

  if (!challenge) {
    return {
      challenge: null,
      approvedSubmissions: [],
      participantCount: 0,
      approvedCount: 0,
    };
  }

  const [approvedSubmissions, participantCount, approvedCount] =
    await Promise.all([
      loadApprovedSubmissionPreviews(challenge.id, previewLimit),
      prisma.challengeSubmission.count({
        where: {
          challengeId: challenge.id,
          isTestData: false,
          status: { in: [...PARTICIPANT_STATUSES] },
        },
      }),
      prisma.challengeSubmission.count({
        where: {
          challengeId: challenge.id,
          isTestData: false,
          status: "APPROVED",
        },
      }),
    ]);

  return {
    challenge,
    approvedSubmissions,
    participantCount,
    approvedCount,
  };
}
