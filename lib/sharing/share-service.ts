/**
 * @file share-service.ts
 */

import { prisma } from "@/lib/db/prisma";
import { buildStudentDisplayName, formatCertificateDate } from "@/lib/certificates/certificate-render";
import { hasPermission } from "@/lib/permissions/permission-service";
import { parseRecipePayload } from "@/lib/tools/recipe-payload-validator";
import { getPublicUserName } from "@/lib/users/public-user";

import { buildShareOgImageUrl, buildShareUrl, generateShareToken } from "./share-token";
import {
  assertRecipeOwner,
  isRecipeShareable,
  logShareSecurityEvent,
} from "./share-security";

import type {
  AdminShareListItem,
  PublicCertificateShareView,
  PublicRecipeShareView,
  ShareEventType,
  ShareListItem,
} from "./share-types";
import type { CourseCertificateType, ShareContentType, ShareStatus } from "@prisma/client";

function mapShareListItem(
  row: {
    id: string;
    shareToken: string;
    contentType: ShareContentType;
    title: string;
    status: ShareStatus;
    isPublic: boolean;
    linkOnly: boolean;
    viewCount: number;
    whatsappShares: number;
    facebookShares: number;
    linkedinShares: number;
    twitterShares: number;
    emailShares: number;
    linkCopies: number;
    createdAt: Date;
    revokedAt: Date | null;
    certificateId: string | null;
    recipeId: string | null;
  },
): ShareListItem {
  const totalShares =
    row.whatsappShares +
    row.facebookShares +
    row.linkedinShares +
    row.twitterShares +
    row.emailShares +
    row.linkCopies;

  return {
    id: row.id,
    shareToken: row.shareToken,
    contentType: row.contentType,
    title: row.title,
    status: row.status,
    isPublic: row.isPublic,
    linkOnly: row.linkOnly,
    viewCount: row.viewCount,
    whatsappShares: row.whatsappShares,
    facebookShares: row.facebookShares,
    linkedinShares: row.linkedinShares,
    twitterShares: row.twitterShares,
    emailShares: row.emailShares,
    linkCopies: row.linkCopies,
    totalShares,
    shareUrl: buildShareUrl(row.contentType, row.shareToken),
    createdAt: row.createdAt.toISOString(),
    revokedAt: row.revokedAt?.toISOString() ?? null,
    certificateId: row.certificateId,
    recipeId: row.recipeId,
  };
}

function resolveCertificateContentType(
  certificateType: CourseCertificateType,
): ShareContentType {
  return certificateType === "participation" ? "DIPLOMA" : "CERTIFICATE";
}

export async function listUserShares(ownerUserId: string): Promise<ShareListItem[]> {
  const rows = await prisma.publicShare.findMany({
    where: { ownerUserId },
    orderBy: [{ createdAt: "desc" }],
  });

  return rows.map(mapShareListItem);
}

export async function getUserTopShares(ownerUserId: string, limit = 5): Promise<ShareListItem[]> {
  const rows = await prisma.publicShare.findMany({
    where: {
      ownerUserId,
      status: "ACTIVE",
    },
    orderBy: [{ viewCount: "desc" }, { createdAt: "desc" }],
    take: limit,
  });

  return rows.map(mapShareListItem);
}

export async function canUserShareCertificate(
  certificateId: string,
  userId: string,
): Promise<{ allowed: boolean; reason?: string; contentType?: ShareContentType }> {
  const certificate = await prisma.userCourseCertificate.findUnique({
    where: { id: certificateId },
  });

  if (!certificate) {
    return { allowed: false, reason: "Zertifikat nicht gefunden." };
  }

  if (certificate.userId !== userId) {
    return { allowed: false, reason: "Nur dein eigenes Zertifikat kann geteilt werden." };
  }

  if (certificate.status !== "issued" && certificate.status !== "available") {
    return { allowed: false, reason: "Zertifikat ist noch nicht verfügbar." };
  }

  return {
    allowed: true,
    contentType: resolveCertificateContentType(certificate.certificateType),
  };
}

export async function canUserShareRecipe(
  recipeId: string,
  userId: string,
): Promise<{ allowed: boolean; reason?: string }> {
  const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } });

  if (!recipe) {
    return { allowed: false, reason: "Rezept nicht gefunden." };
  }

  if (!assertRecipeOwner(recipe, userId)) {
    return { allowed: false, reason: "Nur deine eigenen Rezepte dürfen geteilt werden." };
  }

  if (!(await hasPermission(userId, "recipe.share.own"))) {
    return { allowed: false, reason: "Keine Berechtigung zum Teilen eigener Rezepte." };
  }

  if (!isRecipeShareable(recipe)) {
    return {
      allowed: false,
      reason: "Dieses Rezept darf nicht geteilt werden (Admin- oder Datenbank-Rezept).",
    };
  }

  return { allowed: true };
}

export async function createOrGetCertificateShare(input: {
  certificateId: string;
  ownerUserId: string;
  consent: boolean;
  ipAddress?: string | null;
}): Promise<ShareListItem> {
  const check = await canUserShareCertificate(input.certificateId, input.ownerUserId);

  if (!check.allowed || !check.contentType) {
    await logShareSecurityEvent({
      userId: input.ownerUserId,
      action: "certificate_share_denied",
      ipAddress: input.ipAddress,
      details: { certificateId: input.certificateId, reason: check.reason },
    });
    throw new Error(check.reason ?? "Freigabe nicht erlaubt.");
  }

  if (!input.consent) {
    throw new Error("Öffentliche Freigabe erfordert deine Zustimmung.");
  }

  const certificate = await prisma.userCourseCertificate.findUnique({
    where: { id: input.certificateId },
    include: {
      course: { select: { title: true } },
      publicShare: true,
    },
  });

  if (!certificate) {
    throw new Error("Zertifikat nicht gefunden.");
  }

  if (certificate.publicShare) {
    if (certificate.publicShare.status === "REVOKED") {
      const revived = await prisma.publicShare.update({
        where: { id: certificate.publicShare.id },
        data: {
          status: "ACTIVE",
          revokedAt: null,
          consentAt: new Date(),
          isPublic: true,
        },
      });
      return mapShareListItem(revived);
    }

    return mapShareListItem(certificate.publicShare);
  }

  const title =
    check.contentType === "DIPLOMA"
      ? `Teilnahmeurkunde — ${certificate.course.title}`
      : `Zertifikat — ${certificate.course.title}`;

  const created = await prisma.publicShare.create({
    data: {
      shareToken: generateShareToken(),
      contentType: check.contentType,
      ownerUserId: input.ownerUserId,
      certificateId: input.certificateId,
      title,
      isPublic: true,
      consentAt: new Date(),
      status: "ACTIVE",
    },
  });

  return mapShareListItem(created);
}

export async function createOrUpdateRecipeShare(input: {
  recipeId: string;
  ownerUserId: string;
  isPublic: boolean;
  linkOnly: boolean;
  showIngredients: boolean;
  showInstructions: boolean;
  ipAddress?: string | null;
}): Promise<ShareListItem> {
  const recipe = await prisma.recipe.findUnique({
    where: { id: input.recipeId },
    include: { publicShares: { where: { ownerUserId: input.ownerUserId } } },
  });

  if (!recipe) {
    throw new Error("Rezept nicht gefunden.");
  }

  if (!assertRecipeOwner(recipe, input.ownerUserId)) {
    await logShareSecurityEvent({
      userId: input.ownerUserId,
      recipeId: input.recipeId,
      action: "recipe_share_denied_owner",
      ipAddress: input.ipAddress,
      details: { recipeOwnerId: recipe.userId },
    });
    throw new Error("Zugriff verweigert — nur der Ersteller darf teilen.");
  }

  if (!isRecipeShareable(recipe)) {
    await logShareSecurityEvent({
      userId: input.ownerUserId,
      recipeId: input.recipeId,
      action: "recipe_share_denied_source",
      ipAddress: input.ipAddress,
      details: { source: recipe.source, isOfficialDatabase: recipe.isOfficialDatabase },
    });
    throw new Error("Dieses Rezept darf nicht geteilt werden.");
  }

  const existing = recipe.publicShares[0];

  if (existing) {
    const updated = await prisma.publicShare.update({
      where: { id: existing.id },
      data: {
        isPublic: input.isPublic,
        linkOnly: input.linkOnly,
        showIngredients: input.showIngredients,
        showInstructions: input.showInstructions,
        title: recipe.name,
        status: input.isPublic || input.linkOnly ? "ACTIVE" : "DISABLED",
        revokedAt: null,
      },
    });

    return mapShareListItem(updated);
  }

  if (!input.isPublic && !input.linkOnly) {
    throw new Error("Bitte mindestens eine Freigabeoption wählen.");
  }

  const created = await prisma.publicShare.create({
    data: {
      shareToken: generateShareToken(),
      contentType: "RECIPE",
      ownerUserId: input.ownerUserId,
      recipeId: input.recipeId,
      title: recipe.name,
      isPublic: input.isPublic,
      linkOnly: input.linkOnly,
      showIngredients: input.showIngredients,
      showInstructions: input.showInstructions,
      consentAt: new Date(),
      status: "ACTIVE",
    },
  });

  return mapShareListItem(created);
}

export async function updateUserShare(input: {
  shareId: string;
  ownerUserId: string;
  status?: ShareStatus;
  isPublic?: boolean;
  linkOnly?: boolean;
  showIngredients?: boolean;
  showInstructions?: boolean;
  ipAddress?: string | null;
}): Promise<ShareListItem> {
  const share = await prisma.publicShare.findUnique({
    where: { id: input.shareId },
    include: { recipe: true },
  });

  if (!share || share.ownerUserId !== input.ownerUserId) {
    await logShareSecurityEvent({
      userId: input.ownerUserId,
      shareId: input.shareId,
      recipeId: share?.recipeId ?? undefined,
      action: "share_update_denied",
      ipAddress: input.ipAddress,
    });
    throw new Error("Freigabe nicht gefunden oder Zugriff verweigert.");
  }

  if (share.recipeId && share.recipe) {
    if (share.recipe.userId !== share.ownerUserId) {
      await prisma.publicShare.update({
        where: { id: share.id },
        data: { status: "ADMIN_BLOCKED", revokedAt: new Date() },
      });
      await logShareSecurityEvent({
        userId: input.ownerUserId,
        shareId: share.id,
        recipeId: share.recipeId,
        action: "share_owner_mismatch_blocked",
        ipAddress: input.ipAddress,
      });
      throw new Error("Freigabe wurde aus Sicherheitsgründen gesperrt.");
    }
  }

  const updated = await prisma.publicShare.update({
    where: { id: share.id },
    data: {
      ...(input.status ? { status: input.status, revokedAt: input.status === "REVOKED" ? new Date() : null } : {}),
      ...(input.isPublic !== undefined ? { isPublic: input.isPublic } : {}),
      ...(input.linkOnly !== undefined ? { linkOnly: input.linkOnly } : {}),
      ...(input.showIngredients !== undefined ? { showIngredients: input.showIngredients } : {}),
      ...(input.showInstructions !== undefined ? { showInstructions: input.showInstructions } : {}),
    },
  });

  return mapShareListItem(updated);
}

export async function revokeUserShare(
  shareId: string,
  ownerUserId: string,
  ipAddress?: string | null,
): Promise<void> {
  await updateUserShare({
    shareId,
    ownerUserId,
    status: "REVOKED",
    ipAddress,
  });
}

async function validateShareIntegrity(share: {
  id: string;
  ownerUserId: string;
  recipeId: string | null;
  certificateId: string | null;
  recipe?: { userId: string } | null;
  certificate?: { userId: string } | null;
}): Promise<boolean> {
  if (share.recipeId && share.recipe && share.recipe.userId !== share.ownerUserId) {
    await prisma.publicShare.update({
      where: { id: share.id },
      data: { status: "ADMIN_BLOCKED", revokedAt: new Date() },
    });
    await logShareSecurityEvent({
      shareId: share.id,
      recipeId: share.recipeId,
      action: "share_delivery_owner_mismatch",
      details: { ownerUserId: share.ownerUserId, recipeUserId: share.recipe.userId },
    });
    return false;
  }

  if (
    share.certificateId &&
    share.certificate &&
    share.certificate.userId !== share.ownerUserId
  ) {
    await prisma.publicShare.update({
      where: { id: share.id },
      data: { status: "ADMIN_BLOCKED", revokedAt: new Date() },
    });
    await logShareSecurityEvent({
      shareId: share.id,
      action: "share_delivery_certificate_owner_mismatch",
      details: {
        ownerUserId: share.ownerUserId,
        certificateUserId: share.certificate.userId,
      },
    });
    return false;
  }

  return true;
}

export async function getPublicCertificateShare(
  shareToken: string,
  expectedType?: "CERTIFICATE" | "DIPLOMA",
): Promise<PublicCertificateShareView | null> {
  const share = await prisma.publicShare.findUnique({
    where: { shareToken },
    include: {
      certificate: {
        include: {
          course: { select: { title: true } },
          user: { include: { profile: true } },
        },
      },
    },
  });

  if (
    !share ||
    share.status !== "ACTIVE" ||
    !share.isPublic ||
    (share.contentType !== "CERTIFICATE" && share.contentType !== "DIPLOMA") ||
    (expectedType && share.contentType !== expectedType) ||
    !share.certificate
  ) {
    return null;
  }

  const valid = await validateShareIntegrity({
    id: share.id,
    ownerUserId: share.ownerUserId,
    recipeId: null,
    certificateId: share.certificateId,
    certificate: share.certificate,
  });

  if (!valid) {
    return null;
  }

  const certificate = share.certificate;
  const verificationStatus =
    certificate.status === "revoked"
      ? "revoked"
      : certificate.status === "issued"
        ? "valid"
        : "invalid";

  return {
    contentType: share.contentType,
    title: share.title,
    studentName: certificate.user.profile
      ? buildStudentDisplayName({
          firstName: certificate.user.profile.firstName,
          lastName: certificate.user.profile.lastName,
          company: certificate.user.profile.company,
        })
      : certificate.user.email,
    courseTitle: certificate.course.title,
    issuedAt: certificate.issuedAt ? formatCertificateDate(certificate.issuedAt) : null,
    certificateNumber: certificate.certificateNumber,
    verificationStatus,
    verificationUrl: certificate.verificationUrl,
    shareToken: share.shareToken,
  };
}

function extractRecipeShareDetails(payload: ReturnType<typeof parseRecipePayload>) {
  const ingredients =
    payload?.ingredients
      ?.map((line) => line.name?.trim())
      .filter((name): name is string => Boolean(name)) ?? [];

  const steps = payload?.production?.steps ?? [];
  const instructions = [
    payload?.production?.notes?.trim(),
    ...steps.map((step) => {
      const parts = [step.title?.trim(), step.description?.trim()].filter(Boolean);
      return parts.join(": ");
    }),
  ]
    .filter((entry): entry is string => Boolean(entry))
    .join("\n\n");

  return {
    ingredients: ingredients.length > 0 ? ingredients : null,
    instructions: instructions || null,
  };
}

export async function getPublicRecipeShare(
  shareToken: string,
): Promise<PublicRecipeShareView | null> {
  const share = await prisma.publicShare.findUnique({
    where: { shareToken },
    include: {
      recipe: true,
      owner: { include: { profile: true } },
    },
  });

  if (
    !share ||
    share.status !== "ACTIVE" ||
    share.contentType !== "RECIPE" ||
    !share.recipe ||
    (!share.isPublic && !share.linkOnly)
  ) {
    return null;
  }

  if (!isRecipeShareable(share.recipe)) {
    return null;
  }

  const valid = await validateShareIntegrity({
    id: share.id,
    ownerUserId: share.ownerUserId,
    recipeId: share.recipeId,
    certificateId: null,
    recipe: share.recipe,
  });

  if (!valid) {
    return null;
  }

  const payload = parseRecipePayload(share.recipe.payload);
  const details = extractRecipeShareDetails(payload);

  const imageUrl = share.recipe.imageStorageKey
    ? `/api/tools/recipes/${share.recipe.id}/image`
    : null;

  return {
    contentType: "RECIPE",
    title: share.recipe.name,
    description: share.recipe.description,
    category: share.recipe.category,
    authorName: getPublicUserName({ profile: share.owner.profile }),
    createdAt: share.recipe.createdAt.toISOString(),
    imageUrl,
    ingredients: share.showIngredients ? details.ingredients : null,
    instructions: share.showInstructions ? details.instructions : null,
    shareToken: share.shareToken,
  };
}

export async function getShareByToken(shareToken: string) {
  return prisma.publicShare.findUnique({ where: { shareToken } });
}

export async function recordShareEvent(shareToken: string, event: ShareEventType): Promise<void> {
  const data: Record<string, { increment: number }> = {};

  if (event === "view") data.viewCount = { increment: 1 };
  if (event === "whatsapp") data.whatsappShares = { increment: 1 };
  if (event === "facebook") data.facebookShares = { increment: 1 };
  if (event === "linkedin") data.linkedinShares = { increment: 1 };
  if (event === "twitter") data.twitterShares = { increment: 1 };
  if (event === "email") data.emailShares = { increment: 1 };
  if (event === "link_copy") data.linkCopies = { increment: 1 };

  await prisma.publicShare.updateMany({
    where: { shareToken, status: "ACTIVE" },
    data,
  });
}

export async function listAdminShares(limit = 200): Promise<AdminShareListItem[]> {
  const rows = await prisma.publicShare.findMany({
    include: {
      owner: { include: { profile: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return rows.map((row) => ({
    ...mapShareListItem(row),
    ownerUserId: row.ownerUserId,
    ownerName: getPublicUserName({ profile: row.owner.profile }),
    ownerEmail: row.owner.email,
    adminNote: row.adminNote,
  }));
}

export async function adminUpdateShare(input: {
  shareId: string;
  status: ShareStatus;
  adminNote?: string;
  actorUserId: string;
}): Promise<void> {
  await prisma.publicShare.update({
    where: { id: input.shareId },
    data: {
      status: input.status,
      adminNote: input.adminNote ?? undefined,
      revokedAt: input.status === "REVOKED" || input.status === "ADMIN_BLOCKED" ? new Date() : null,
    },
  });

  await logShareSecurityEvent({
    userId: input.actorUserId,
    shareId: input.shareId,
    action: "admin_share_status_change",
    details: { status: input.status, adminNote: input.adminNote },
  });
}

export function getShareMetadata(input: {
  title: string;
  description: string;
  shareToken: string;
  contentType?: ShareContentType;
}) {
  const contentType = input.contentType ?? "RECIPE";
  const url = buildShareUrl(contentType, input.shareToken);
  const ogImage = buildShareOgImageUrl(input.shareToken);

  return {
    title: input.title,
    description: input.description,
    openGraph: {
      title: input.title,
      description: input.description,
      url,
      images: [{ url: ogImage, width: 1200, height: 630 }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [ogImage],
    },
  };
}
