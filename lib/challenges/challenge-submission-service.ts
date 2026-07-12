/**
 * @file challenge-submission-service.ts
 * @purpose Einreichungen für Community Challenges.
 */

import type {
  ChallengeSubmission,
  ChallengeSubmissionMedia,
  CommunityChallenge,
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

import { checkChallengeEligibility } from "./challenge-eligibility";
import {
  buildChallengeMediaPublicUrl,
  getMaxChallengeImageBytes,
  getMaxChallengeImagesPerSubmission,
  guessChallengeImageMimeType,
  isAllowedChallengeImage,
  saveChallengeSubmissionImage,
} from "./challenge-media-storage";
import type {
  AdminChallengeSubmission,
  ChallengeModerationAction,
  ChallengeSubmissionConfig,
  ChallengeSubmissionEntry,
  ChallengeSubmissionFieldConfig,
  ChallengeSubmissionPreview,
  SaveSubmissionDraftInput,
} from "./challenge-types";
import type { ChallengeSubmissionStatus } from "@prisma/client";

const DEFAULT_FIELD_CONFIG: Required<ChallengeSubmissionFieldConfig> = {
  recipeRequired: false,
  videoAllowed: true,
  videoRequired: false,
  maxImages: 5,
  maxImageBytes: 10 * 1024 * 1024,
  minTitleLength: 3,
  maxTitleLength: 120,
  minDescriptionLength: 20,
  maxDescriptionLength: 2000,
  requirePublicConsent: true,
  requireMediaRightsConsent: true,
};

const EDITABLE_STATUSES = new Set(["DRAFT", "REJECTED"]);

function toSubmissionEntry(
  submission: ChallengeSubmission & { media: ChallengeSubmissionMedia[] },
): ChallengeSubmissionEntry {
  return {
    id: submission.id,
    challengeId: submission.challengeId,
    userId: submission.userId,
    title: submission.title,
    description: submission.description,
    recipeContent: submission.recipeContent,
    videoUrl: submission.videoUrl,
    status: submission.status,
    publicConsent: submission.publicConsent,
    mediaRightsConsent: submission.mediaRightsConsent,
    mediaRightsConsentAt:
      submission.mediaRightsConsentAt?.toISOString() ?? null,
    submittedAt: submission.submittedAt?.toISOString() ?? null,
    reviewedAt: submission.reviewedAt?.toISOString() ?? null,
    reviewedById: submission.reviewedById,
    rejectionReason: submission.rejectionReason,
    isWinner: submission.isWinner,
    winnerRank: submission.winnerRank,
    voteCount: submission.voteCount,
    createdAt: submission.createdAt.toISOString(),
    updatedAt: submission.updatedAt.toISOString(),
    media: submission.media
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((item) => ({
        id: item.id,
        storageUrl: item.storageUrl,
        mimeType: item.mimeType,
        sizeBytes: item.sizeBytes,
        mediaType: item.mediaType,
        displayOrder: item.displayOrder,
      })),
  };
}

export function parseSubmissionConfig(
  value: unknown,
): ChallengeSubmissionConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const raw = value as Record<string, unknown>;
  const fieldsRaw =
    raw.fields && typeof raw.fields === "object" && !Array.isArray(raw.fields)
      ? (raw.fields as Record<string, unknown>)
      : {};

  const fields: ChallengeSubmissionFieldConfig = {
    recipeRequired:
      typeof fieldsRaw.recipeRequired === "boolean"
        ? fieldsRaw.recipeRequired
        : undefined,
    videoAllowed:
      typeof fieldsRaw.videoAllowed === "boolean"
        ? fieldsRaw.videoAllowed
        : undefined,
    videoRequired:
      typeof fieldsRaw.videoRequired === "boolean"
        ? fieldsRaw.videoRequired
        : undefined,
    maxImages:
      typeof fieldsRaw.maxImages === "number" && fieldsRaw.maxImages > 0
        ? Math.min(fieldsRaw.maxImages, getMaxChallengeImagesPerSubmission())
        : undefined,
    maxImageBytes:
      typeof fieldsRaw.maxImageBytes === "number" && fieldsRaw.maxImageBytes > 0
        ? Math.min(fieldsRaw.maxImageBytes, getMaxChallengeImageBytes())
        : undefined,
    minTitleLength:
      typeof fieldsRaw.minTitleLength === "number" && fieldsRaw.minTitleLength > 0
        ? fieldsRaw.minTitleLength
        : undefined,
    maxTitleLength:
      typeof fieldsRaw.maxTitleLength === "number" && fieldsRaw.maxTitleLength > 0
        ? fieldsRaw.maxTitleLength
        : undefined,
    minDescriptionLength:
      typeof fieldsRaw.minDescriptionLength === "number" &&
      fieldsRaw.minDescriptionLength > 0
        ? fieldsRaw.minDescriptionLength
        : undefined,
    maxDescriptionLength:
      typeof fieldsRaw.maxDescriptionLength === "number" &&
      fieldsRaw.maxDescriptionLength > 0
        ? fieldsRaw.maxDescriptionLength
        : undefined,
    requirePublicConsent:
      typeof fieldsRaw.requirePublicConsent === "boolean"
        ? fieldsRaw.requirePublicConsent
        : undefined,
    requireMediaRightsConsent:
      typeof fieldsRaw.requireMediaRightsConsent === "boolean"
        ? fieldsRaw.requireMediaRightsConsent
        : undefined,
  };

  return { fields };
}

function resolveFieldConfig(
  config: ChallengeSubmissionConfig,
): Required<ChallengeSubmissionFieldConfig> {
  return {
    ...DEFAULT_FIELD_CONFIG,
    ...config.fields,
  };
}

function isChallengeOpenForSubmissions(challenge: CommunityChallenge): boolean {
  if (challenge.status !== "ACTIVE") {
    return false;
  }

  return challenge.submissionDeadline.getTime() >= Date.now();
}

async function loadChallengeOrFail(
  challengeId: string,
): Promise<UserServiceResult<CommunityChallenge>> {
  const challenge = await prisma.communityChallenge.findUnique({
    where: { id: challengeId },
  });

  if (!challenge) {
    return userFailure({
      code: "NOT_FOUND",
      message: "Challenge nicht gefunden.",
    });
  }

  return userSuccess(challenge);
}

export async function getUserSubmission(
  challengeId: string,
  userId: string,
): Promise<ChallengeSubmissionEntry | null> {
  const submission = await prisma.challengeSubmission.findUnique({
    where: {
      challengeId_userId: { challengeId, userId },
    },
    include: {
      media: true,
    },
  });

  if (!submission) {
    return null;
  }

  return toSubmissionEntry(submission);
}

async function syncSubmissionMedia(input: {
  submissionId: string;
  removeMediaIds?: string[];
  newImages?: SaveSubmissionDraftInput["newImages"];
  maxImages: number;
  maxImageBytes: number;
}): Promise<UserServiceResult<true>> {
  if (input.removeMediaIds && input.removeMediaIds.length > 0) {
    await prisma.challengeSubmissionMedia.deleteMany({
      where: {
        id: { in: input.removeMediaIds },
        submissionId: input.submissionId,
      },
    });
  }

  const currentCount = await prisma.challengeSubmissionMedia.count({
    where: { submissionId: input.submissionId },
  });

  const newImages = input.newImages ?? [];

  if (currentCount + newImages.length > input.maxImages) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: `Maximal ${input.maxImages} Bilder pro Einreichung erlaubt.`,
    });
  }

  for (const [index, image] of newImages.entries()) {
    if (!isAllowedChallengeImage(image.fileName, image.mimeType)) {
      return userFailure({
        code: "VALIDATION_ERROR",
        message: "Nur Bilddateien (JPG, PNG, WebP, GIF) sind erlaubt.",
      });
    }

    try {
      const saved = await saveChallengeSubmissionImage({
        submissionId: input.submissionId,
        fileName: image.fileName,
        bytes: image.bytes,
        maxBytes: input.maxImageBytes,
      });

      const media = await prisma.challengeSubmissionMedia.create({
        data: {
          submissionId: input.submissionId,
          storageKey: saved.storageKey,
          storageUrl: "",
          mimeType:
            image.mimeType || guessChallengeImageMimeType(saved.storageKey),
          sizeBytes: image.bytes.byteLength,
          mediaType: "image",
          displayOrder: currentCount + index,
        },
      });

      await prisma.challengeSubmissionMedia.update({
        where: { id: media.id },
        data: {
          storageUrl: buildChallengeMediaPublicUrl(media.id),
        },
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Bild konnte nicht gespeichert werden.";

      return userFailure({
        code: "VALIDATION_ERROR",
        message,
      });
    }
  }

  return userSuccess(true);
}

export async function saveSubmissionDraft(
  challengeId: string,
  userId: string,
  input: SaveSubmissionDraftInput,
): Promise<UserServiceResult<ChallengeSubmissionEntry>> {
  const challengeResult = await loadChallengeOrFail(challengeId);

  if (!challengeResult.success) {
    return challengeResult;
  }

  const challenge = challengeResult.data;
  const eligibility = await checkChallengeEligibility(userId, challenge);

  if (!eligibility.eligible) {
    return userFailure({
      code: "FORBIDDEN",
      message: eligibility.reason ?? "Keine Teilnahmeberechtigung.",
    });
  }

  if (!isChallengeOpenForSubmissions(challenge)) {
    return userFailure({
      code: "CONFLICT",
      message: "Die Einreichungsfrist für diese Challenge ist abgelaufen.",
    });
  }

  const fields = resolveFieldConfig(parseSubmissionConfig(challenge.submissionConfig));
  const title = input.title.trim();
  const description = input.description.trim();

  if (title.length < fields.minTitleLength) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: `Titel muss mindestens ${fields.minTitleLength} Zeichen lang sein.`,
    });
  }

  if (title.length > fields.maxTitleLength) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: `Titel darf maximal ${fields.maxTitleLength} Zeichen lang sein.`,
    });
  }

  const existing = await prisma.challengeSubmission.findUnique({
    where: { challengeId_userId: { challengeId, userId } },
    include: { media: true },
  });

  if (existing && !EDITABLE_STATUSES.has(existing.status)) {
    return userFailure({
      code: "CONFLICT",
      message: "Diese Einreichung kann nicht mehr bearbeitet werden.",
    });
  }

  try {
    const submission = existing
      ? await prisma.challengeSubmission.update({
          where: { id: existing.id },
          data: {
            title,
            description,
            recipeContent: input.recipeContent?.trim() || null,
            videoUrl: fields.videoAllowed
              ? input.videoUrl?.trim() || null
              : null,
            publicConsent: input.publicConsent ?? existing.publicConsent,
            mediaRightsConsent:
              input.mediaRightsConsent ?? existing.mediaRightsConsent,
            mediaRightsConsentAt:
              input.mediaRightsConsent && !existing.mediaRightsConsent
                ? new Date()
                : existing.mediaRightsConsentAt,
            status: "DRAFT",
            rejectionReason: null,
          },
          include: { media: true },
        })
      : await prisma.challengeSubmission.create({
          data: {
            challengeId,
            userId,
            title,
            description,
            recipeContent: input.recipeContent?.trim() || null,
            videoUrl: fields.videoAllowed
              ? input.videoUrl?.trim() || null
              : null,
            status: "DRAFT",
            publicConsent: input.publicConsent ?? false,
            mediaRightsConsent: input.mediaRightsConsent ?? false,
            mediaRightsConsentAt: input.mediaRightsConsent ? new Date() : null,
          },
          include: { media: true },
        });

    const mediaResult = await syncSubmissionMedia({
      submissionId: submission.id,
      removeMediaIds: input.removeMediaIds,
      newImages: input.newImages,
      maxImages: fields.maxImages,
      maxImageBytes: fields.maxImageBytes,
    });

    if (!mediaResult.success) {
      return mediaResult;
    }

    const refreshed = await prisma.challengeSubmission.findUnique({
      where: { id: submission.id },
      include: { media: true },
    });

    if (!refreshed) {
      return userFailure({
        code: "INTERNAL_ERROR",
        message: "Einreichung konnte nicht geladen werden.",
      });
    }

    return userSuccess(toSubmissionEntry(refreshed));
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Entwurf konnte nicht gespeichert werden.",
    });
  }
}

function validateSubmissionForSubmit(
  submission: ChallengeSubmission & { media: ChallengeSubmissionMedia[] },
  challenge: CommunityChallenge,
): string | null {
  const fields = resolveFieldConfig(parseSubmissionConfig(challenge.submissionConfig));

  if (submission.title.trim().length < fields.minTitleLength) {
    return `Titel muss mindestens ${fields.minTitleLength} Zeichen lang sein.`;
  }

  if (submission.description.trim().length < fields.minDescriptionLength) {
    return `Beschreibung muss mindestens ${fields.minDescriptionLength} Zeichen lang sein.`;
  }

  if (fields.recipeRequired && !submission.recipeContent?.trim()) {
    return "Rezeptinhalt ist erforderlich.";
  }

  if (fields.videoRequired && !submission.videoUrl?.trim()) {
    return "Video-Link ist erforderlich.";
  }

  if (submission.media.length === 0) {
    return "Mindestens ein Bild ist erforderlich.";
  }

  if (fields.requirePublicConsent && !submission.publicConsent) {
    return "Zustimmung zur öffentlichen Anzeige ist erforderlich.";
  }

  if (fields.requireMediaRightsConsent && !submission.mediaRightsConsent) {
    return "Zustimmung zu Bildrechten ist erforderlich.";
  }

  return null;
}

export async function submitSubmission(
  challengeId: string,
  userId: string,
): Promise<UserServiceResult<ChallengeSubmissionEntry>> {
  const challengeResult = await loadChallengeOrFail(challengeId);

  if (!challengeResult.success) {
    return challengeResult;
  }

  const challenge = challengeResult.data;
  const eligibility = await checkChallengeEligibility(userId, challenge);

  if (!eligibility.eligible) {
    return userFailure({
      code: "FORBIDDEN",
      message: eligibility.reason ?? "Keine Teilnahmeberechtigung.",
    });
  }

  if (!isChallengeOpenForSubmissions(challenge)) {
    return userFailure({
      code: "CONFLICT",
      message: "Die Einreichungsfrist für diese Challenge ist abgelaufen.",
    });
  }

  const submission = await prisma.challengeSubmission.findUnique({
    where: { challengeId_userId: { challengeId, userId } },
    include: { media: true },
  });

  if (!submission) {
    return userFailure({
      code: "NOT_FOUND",
      message: "Kein Entwurf vorhanden. Bitte speichere zuerst deine Einreichung.",
    });
  }

  if (!EDITABLE_STATUSES.has(submission.status)) {
    return userFailure({
      code: "CONFLICT",
      message: "Diese Einreichung wurde bereits eingereicht.",
    });
  }

  const validationError = validateSubmissionForSubmit(submission, challenge);

  if (validationError) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: validationError,
    });
  }

  try {
    const updated = await prisma.challengeSubmission.update({
      where: { id: submission.id },
      data: {
        status: "SUBMITTED",
        submittedAt: new Date(),
        reviewedAt: null,
        reviewedById: null,
        rejectionReason: null,
        mediaRightsConsentAt: submission.mediaRightsConsent
          ? submission.mediaRightsConsentAt ?? new Date()
          : null,
      },
      include: { media: true },
    });

    await prisma.challengeUserState.upsert({
      where: {
        challengeId_userId: { challengeId, userId },
      },
      create: {
        challengeId,
        userId,
        popupState: "SUBMITTED",
      },
      update: {
        popupState: "SUBMITTED",
      },
    });

    return userSuccess(toSubmissionEntry(updated));
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Einreichung konnte nicht abgesendet werden.",
    });
  }
}

export async function listApprovedSubmissions(
  challengeId: string,
  limit = 20,
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

export async function listAdminChallengeSubmissions(
  challengeId: string,
  filters?: { status?: ChallengeSubmissionStatus | "all" },
): Promise<UserServiceResult<AdminChallengeSubmission[]>> {
  const challenge = await prisma.communityChallenge.findUnique({
    where: { id: challengeId },
    select: { id: true },
  });

  if (!challenge) {
    return userFailure({
      code: "NOT_FOUND",
      message: "Challenge nicht gefunden.",
    });
  }

  const submissions = await prisma.challengeSubmission.findMany({
    where: {
      challengeId,
      status:
        filters?.status && filters.status !== "all"
          ? filters.status
          : undefined,
    },
    orderBy: [{ submittedAt: "desc" }, { createdAt: "desc" }],
    include: {
      user: { include: { profile: true } },
      _count: { select: { media: true } },
    },
  });

  return userSuccess(
    submissions.map((submission) => ({
      id: submission.id,
      challengeId: submission.challengeId,
      userId: submission.userId,
      userDisplayName: getPublicUserName(submission.user),
      title: submission.title,
      description: submission.description,
      recipeContent: submission.recipeContent,
      videoUrl: submission.videoUrl,
      status: submission.status,
      submittedAt: submission.submittedAt?.toISOString() ?? null,
      reviewedAt: submission.reviewedAt?.toISOString() ?? null,
      rejectionReason: submission.rejectionReason,
      isWinner: submission.isWinner,
      winnerRank: submission.winnerRank,
      voteCount: submission.voteCount,
      mediaCount: submission._count.media,
      createdAt: submission.createdAt.toISOString(),
    })),
  );
}

export async function moderateSubmissionByStatus(
  adminUserId: string,
  submissionId: string,
  status: ChallengeSubmissionStatus,
  rejectionReason?: string | null,
): Promise<UserServiceResult<ChallengeSubmissionEntry>> {
  if (status === "APPROVED") {
    return moderateSubmission(adminUserId, submissionId, "approve");
  }

  if (status === "REJECTED") {
    return moderateSubmission(
      adminUserId,
      submissionId,
      "reject",
      rejectionReason,
    );
  }

  if (status === "UNDER_REVIEW") {
    return moderateSubmission(adminUserId, submissionId, "under_review");
  }

  if (status === "WINNER") {
    const submission = await prisma.challengeSubmission.findUnique({
      where: { id: submissionId },
      include: { media: true },
    });

    if (!submission) {
      return userFailure({
        code: "NOT_FOUND",
        message: "Einreichung nicht gefunden.",
      });
    }

    const updated = await prisma.challengeSubmission.update({
      where: { id: submissionId },
      data: {
        status: "WINNER",
        isWinner: true,
        reviewedAt: new Date(),
        reviewedById: adminUserId,
        rejectionReason: null,
      },
      include: { media: true },
    });

    return userSuccess(toSubmissionEntry(updated));
  }

  return userFailure({
    code: "VALIDATION_ERROR",
    message: "Dieser Status kann nicht per Moderation gesetzt werden.",
  });
}

export async function moderateSubmission(
  adminUserId: string,
  submissionId: string,
  action: ChallengeModerationAction,
  rejectionReason?: string | null,
): Promise<UserServiceResult<ChallengeSubmissionEntry>> {
  const submission = await prisma.challengeSubmission.findUnique({
    where: { id: submissionId },
    include: { media: true },
  });

  if (!submission) {
    return userFailure({
      code: "NOT_FOUND",
      message: "Einreichung nicht gefunden.",
    });
  }

  if (
    submission.status === "DRAFT" ||
    submission.status === "WITHDRAWN"
  ) {
    return userFailure({
      code: "CONFLICT",
      message: "Entwürfe können nicht moderiert werden.",
    });
  }

  let nextStatus: Prisma.ChallengeSubmissionUpdateInput["status"];

  switch (action) {
    case "approve":
      nextStatus = "APPROVED";
      break;
    case "reject":
      nextStatus = "REJECTED";
      break;
    case "under_review":
      nextStatus = "UNDER_REVIEW";
      break;
    default:
      return userFailure({
        code: "VALIDATION_ERROR",
        message: "Unbekannte Moderationsaktion.",
      });
  }

  if (action === "reject" && !rejectionReason?.trim()) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: "Bitte gib einen Ablehnungsgrund an.",
    });
  }

  try {
    const updated = await prisma.challengeSubmission.update({
      where: { id: submissionId },
      data: {
        status: nextStatus,
        reviewedAt: new Date(),
        reviewedById: adminUserId,
        rejectionReason: action === "reject" ? rejectionReason?.trim() ?? null : null,
      },
      include: { media: true },
    });

    return userSuccess(toSubmissionEntry(updated));
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Einreichung konnte nicht aktualisiert werden.",
    });
  }
}

export async function listUserChallengeOverview(userId: string): Promise<{
  activeChallenge: { id: string; title: string; slug: string } | null;
  submissions: Array<{ id: string; title: string; status: string }>;
}> {
  const activeChallenge = await prisma.communityChallenge.findFirst({
    where: {
      status: { in: ["ACTIVE", "VOTING"] },
      showInMemberDashboard: true,
    },
    orderBy: { startAt: "desc" },
    select: { id: true, title: true, slug: true },
  });

  const submissions = await prisma.challengeSubmission.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, status: true },
  });

  return {
    activeChallenge,
    submissions: submissions.map((entry) => ({
      id: entry.id,
      title: entry.title,
      status: entry.status,
    })),
  };
}
