/**
 * @file privacy-request-service.ts
 */

import { createHash, randomBytes } from "node:crypto";

import { prisma } from "@/lib/db/prisma";
import { buildAppUrl } from "@/lib/mail/mail-service";
import { sendPlatformEmail } from "@/lib/email/email-service";
import { ensureEmailSystemDefaults } from "@/lib/email/email-bootstrap";
import { generateSupportTicketNumber } from "@/lib/support/support-ticket-number";
import {
  userFailure,
  userSuccess,
  type UserServiceResult,
} from "@/lib/users/user-errors";

import type { PrivacyRequestType } from "@prisma/client";

const EMAIL_TOKEN_TTL_MS = 45 * 60 * 1000;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function generateRequestNumber(type: PrivacyRequestType): string {
  const prefix = type === "DELETION" ? "DEL" : type === "EXPORT" ? "EXP" : "DSR";
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = randomBytes(3).toString("hex").toUpperCase();
  return `${prefix}-${stamp}-${random}`;
}

export async function getPrivacyCenterOverview(userId: string) {
  const [user, requests, exports, messages] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        membership: true,
        accountingPositions: { take: 5, orderBy: { createdAt: "desc" } },
        courseAccess: { take: 5 },
        supportTicketsCreated: { take: 5, orderBy: { createdAt: "desc" } },
      },
    }),
    prisma.privacyRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.dataExportRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.userAccountMessage.findMany({
      where: { userId, messageType: { startsWith: "privacy_" } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return { user, requests, exports, messages };
}

export async function createDataExportRequest(
  userId: string,
): Promise<UserServiceResult<{ requestId: string; requestNumber: string }>> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (!user) {
    return userFailure({
      code: "NOT_FOUND",
      message: "Benutzer nicht gefunden.",
    });
  }

  const [existingExport, pendingPrivacy] = await Promise.all([
    prisma.dataExportRequest.findFirst({
      where: {
        userId,
        status: { in: ["REQUESTED", "PROCESSING", "READY"] },
      },
    }),
    prisma.privacyRequest.findFirst({
      where: {
        userId,
        type: "EXPORT",
        status: "EMAIL_CONFIRMATION_PENDING",
      },
    }),
  ]);

  if (existingExport || pendingPrivacy) {
    return userFailure({
      code: "CONFLICT",
      message: "Es läuft bereits ein Datenexport für dein Konto.",
    });
  }

  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + EMAIL_TOKEN_TTL_MS);

  const privacyRequest = await prisma.privacyRequest.create({
    data: {
      userId,
      type: "EXPORT",
      status: "EMAIL_CONFIRMATION_PENDING",
      requestNumber: generateRequestNumber("EXPORT"),
      emailConfirmationTokenHash: tokenHash,
      emailConfirmationExpiresAt: expiresAt,
    },
  });

  await prisma.dataExportRequest.create({
    data: {
      userId,
      status: "REQUESTED",
      privacyRequestId: privacyRequest.id,
    },
  });

  const confirmUrl = buildAppUrl(
    `/account/datenschutz/export-bestaetigen?token=${encodeURIComponent(token)}`,
  );

  await ensureEmailSystemDefaults();

  await sendPlatformEmail({
    category: "PRIVACY",
    recipientEmail: user.email,
    recipientUserId: userId,
    templateKey: "privacy.export.confirm",
    variables: { actionUrl: confirmUrl },
    priority: "HIGH",
    relatedEntity: { type: "privacy_request", id: privacyRequest.id },
    accountMessage: {
      type: "privacy_export_email_sent",
      title: "Bestätigungs-E-Mail gesendet",
      body: "Wir haben dir eine E-Mail zur Bestätigung des Datenexports gesendet.",
      linkUrl: "/account/datenschutz",
    },
  });

  return userSuccess({
    requestId: privacyRequest.id,
    requestNumber: privacyRequest.requestNumber,
  });
}

export async function confirmExportEmailToken(
  token: string,
): Promise<UserServiceResult<{ exportId: string; requestNumber: string }>> {
  const tokenHash = hashToken(token);

  const request = await prisma.privacyRequest.findFirst({
    where: {
      emailConfirmationTokenHash: tokenHash,
      type: "EXPORT",
      status: "EMAIL_CONFIRMATION_PENDING",
      emailConfirmationExpiresAt: { gt: new Date() },
    },
    include: { dataExport: true },
  });

  if (!request?.dataExport) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: "Der Bestätigungslink ist ungültig oder abgelaufen.",
    });
  }

  await prisma.privacyRequest.update({
    where: { id: request.id },
    data: {
      emailConfirmedAt: new Date(),
      emailConfirmationTokenHash: null,
      status: "CONFIRMED",
    },
  });

  const { processDataExportRequest } = await import("./data-export-service");
  void processDataExportRequest(request.dataExport.id).catch(console.error);

  return userSuccess({
    exportId: request.dataExport.id,
    requestNumber: request.requestNumber,
  });
}

export async function startAccountDeletionRequest(input: {
  userId: string;
  password: string;
  acknowledged: boolean;
}): Promise<UserServiceResult<true>> {
  if (!input.acknowledged) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: "Bitte bestätige die Folgen der Kontolöschung.",
    });
  }

  const user = await prisma.user.findUnique({ where: { id: input.userId } });

  if (!user?.passwordHash) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: "Passwortbestätigung nicht möglich.",
    });
  }

  const { verifyPassword } = await import("@/lib/auth/password");
  const valid = await verifyPassword(input.password, user.passwordHash);

  if (!valid) {
    return userFailure({
      code: "FORBIDDEN",
      message: "Das Passwort ist nicht korrekt.",
    });
  }

  const existing = await prisma.privacyRequest.findFirst({
    where: {
      userId: input.userId,
      type: "DELETION",
      status: {
        in: [
          "EMAIL_CONFIRMATION_PENDING",
          "CONFIRMED",
          "UNDER_REVIEW",
          "PARTIALLY_FULFILLED",
        ],
      },
    },
  });

  if (existing) {
    return userFailure({
      code: "CONFLICT",
      message: "Es läuft bereits eine Löschanfrage für dein Konto.",
    });
  }

  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + EMAIL_TOKEN_TTL_MS);

  const request = await prisma.privacyRequest.create({
    data: {
      userId: input.userId,
      type: "DELETION",
      status: "EMAIL_CONFIRMATION_PENDING",
      requestNumber: generateRequestNumber("DELETION"),
      emailConfirmationTokenHash: tokenHash,
      emailConfirmationExpiresAt: expiresAt,
    },
  });

  const confirmUrl = buildAppUrl(
    `/account/datenschutz/loeschung-bestaetigen?token=${encodeURIComponent(token)}`,
  );

  await ensureEmailSystemDefaults();

  await sendPlatformEmail({
    category: "PRIVACY",
    recipientEmail: user.email,
    recipientUserId: input.userId,
    templateKey: "privacy.deletion.confirm",
    variables: { actionUrl: confirmUrl },
    priority: "HIGH",
    relatedEntity: { type: "privacy_request", id: request.id },
    accountMessage: {
      type: "privacy_deletion_email_sent",
      title: "Bestätigungs-E-Mail gesendet",
      body: "Wir haben dir eine E-Mail zur Bestätigung der Kontolöschung gesendet.",
      linkUrl: "/account/datenschutz",
    },
  });

  return userSuccess(true);
}

export async function confirmDeletionEmailToken(
  token: string,
): Promise<UserServiceResult<{ requestId: string; requestNumber: string }>> {
  const tokenHash = hashToken(token);

  const request = await prisma.privacyRequest.findFirst({
    where: {
      emailConfirmationTokenHash: tokenHash,
      status: "EMAIL_CONFIRMATION_PENDING",
      emailConfirmationExpiresAt: { gt: new Date() },
    },
  });

  if (!request) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: "Der Bestätigungslink ist ungültig oder abgelaufen.",
    });
  }

  await prisma.privacyRequest.update({
    where: { id: request.id },
    data: {
      emailConfirmedAt: new Date(),
      emailConfirmationTokenHash: null,
    },
  });

  return userSuccess({
    requestId: request.id,
    requestNumber: request.requestNumber,
  });
}

export async function finalizeAccountDeletion(input: {
  userId: string;
  requestId: string;
}): Promise<UserServiceResult<true>> {
  const request = await prisma.privacyRequest.findFirst({
    where: {
      id: input.requestId,
      userId: input.userId,
      type: "DELETION",
      status: "EMAIL_CONFIRMATION_PENDING",
      emailConfirmedAt: { not: null },
    },
  });

  if (!request) {
    return userFailure({
      code: "NOT_FOUND",
      message: "Löschanfrage nicht gefunden oder E-Mail noch nicht bestätigt.",
    });
  }

  await prisma.privacyRequest.update({
    where: { id: request.id },
    data: {
      finalConfirmedAt: new Date(),
      status: "CONFIRMED",
    },
  });

  await prisma.privacyRequest.update({
    where: { id: request.id },
    data: { status: "UNDER_REVIEW" },
  });

  const { executeAccountDeletionPlan } = await import("./account-deletion-service");
  await executeAccountDeletionPlan({
    userId: input.userId,
    privacyRequestId: request.id,
  });

  return userSuccess(true);
}
