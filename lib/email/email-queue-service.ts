/**
 * @file email-queue-service.ts
 */

import { prisma } from "@/lib/db/prisma";
import { createUserAccountMessage } from "@/lib/account/account-message-service";

import {
  buildEnvFallbackProvider,
  buildRuntimeProviderFromConfig,
  sendViaRuntimeProvider,
} from "./email-provider-runtime";

import type { EmailMessage, EmailPriority } from "@prisma/client";

const RETRY_DELAYS_MS = [
  0,
  5 * 60 * 1000,
  30 * 60 * 1000,
  2 * 60 * 60 * 1000,
  12 * 60 * 60 * 1000,
];

const PROCESSING_LOCK_MS = 5 * 60 * 1000;
const BATCH_SIZE = 25;

function isPermanentError(code: string | null | undefined): boolean {
  if (!code) {
    return false;
  }

  return [
    "INVALID_RECIPIENT",
    "SUPPRESSED",
    "UNVERIFIED_SENDER",
    "TEMPLATE_MISSING",
    "MARKETING_BLOCKED",
    "USER_TO_USER_FORBIDDEN",
  ].includes(code);
}

function priorityOrder(priority: EmailPriority): number {
  switch (priority) {
    case "CRITICAL":
      return 0;
    case "HIGH":
      return 1;
    case "NORMAL":
      return 2;
    case "LOW":
      return 3;
    case "BULK":
      return 4;
    default:
      return 2;
  }
}

export async function processEmailQueueBatch(): Promise<{
  processed: number;
  sent: number;
  failed: number;
  retried: number;
}> {
  const now = new Date();

  await prisma.emailMessage.updateMany({
    where: {
      status: "PROCESSING",
      processingLockAt: { lt: new Date(now.getTime() - PROCESSING_LOCK_MS) },
    },
    data: {
      status: "RETRYING",
      processingLockAt: null,
    },
  });

  const candidates = await prisma.emailMessage.findMany({
    where: {
      status: { in: ["PENDING", "RETRYING"] },
      OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: now } }],
      scheduledAt: { lte: now },
    },
    include: {
      senderIdentity: { include: { providerConfig: true } },
      attachments: true,
    },
    take: BATCH_SIZE,
  });

  const sorted = candidates.sort(
    (a, b) => priorityOrder(a.priority) - priorityOrder(b.priority),
  );

  let processed = 0;
  let sent = 0;
  let failed = 0;
  let retried = 0;

  for (const message of sorted) {
    const locked = await prisma.emailMessage.updateMany({
      where: {
        id: message.id,
        status: { in: ["PENDING", "RETRYING"] },
        processingLockAt: null,
      },
      data: {
        status: "PROCESSING",
        processingLockAt: now,
        attempts: { increment: 1 },
      },
    });

    if (locked.count === 0) {
      continue;
    }

    processed += 1;

    try {
      let senderIdentity = message.senderIdentity;
      let providerConfig = senderIdentity?.providerConfig ?? null;

      if (!providerConfig) {
        const resolvedSender = await prisma.emailSenderIdentity.findFirst({
          where: {
            active: true,
            verified: true,
            providerConfig: { active: true },
          },
          include: { providerConfig: true },
          orderBy: [{ defaultSender: "desc" }, { sortOrder: "asc" }],
        });

        if (resolvedSender?.providerConfig) {
          senderIdentity = resolvedSender;
          providerConfig = resolvedSender.providerConfig;
        }
      }

      const runtime = providerConfig
        ? buildRuntimeProviderFromConfig(providerConfig, senderIdentity ?? undefined)
        : buildEnvFallbackProvider(senderIdentity ?? undefined);

      const result = await sendViaRuntimeProvider({
        runtime,
        message: {
          to: message.recipientEmail,
          subject: message.isTest ? `TEST – ${message.subjectSnapshot}` : message.subjectSnapshot,
          text: message.textSnapshot ?? "",
          html: message.htmlSnapshot ?? "",
        },
      });

      if (result.sent || runtime.providerType === "DEV") {
        await prisma.emailMessage.update({
          where: { id: message.id },
          data: {
            status: "SENT",
            sentAt: new Date(),
            processingLockAt: null,
            providerMessageId: result.providerMessageId ?? null,
            lastErrorCode: null,
            lastErrorMessage: null,
            ...(senderIdentity?.id && !message.senderIdentityId
              ? {
                  senderIdentityId: senderIdentity.id,
                  providerConfigId: senderIdentity.providerConfigId,
                }
              : {}),
          },
        });

        if (senderIdentity?.id) {
          await prisma.emailSenderIdentity.update({
            where: { id: senderIdentity.id },
            data: { lastSuccessfulSendAt: new Date(), lastError: null },
          });
        }

        if (
          message.createAccountMessage &&
          message.recipientUserId &&
          message.accountMessageTitle &&
          message.accountMessageBody
        ) {
          await createUserAccountMessage({
            userId: message.recipientUserId,
            messageType: message.accountMessageType ?? "email_notification",
            title: message.accountMessageTitle,
            body: message.accountMessageBody,
            linkUrl: message.accountMessageLink ?? undefined,
          });
        }

        sent += 1;
        continue;
      }

      throw new Error("Provider hat den Versand abgelehnt.");
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Unbekannter Fehler";
      const attempts = message.attempts + 1;
      const permanent = isPermanentError(
        error instanceof Error && "code" in error
          ? String((error as { code?: string }).code)
          : null,
      );

      if (permanent || attempts >= RETRY_DELAYS_MS.length) {
        await prisma.emailMessage.update({
          where: { id: message.id },
          data: {
            status: "FAILED",
            failedAt: new Date(),
            processingLockAt: null,
            lastErrorCode: permanent ? "PERMANENT" : "MAX_RETRIES",
            lastErrorMessage: detail,
          },
        });
        failed += 1;
      } else {
        const delay = RETRY_DELAYS_MS[attempts] ?? RETRY_DELAYS_MS.at(-1)!;

        await prisma.emailMessage.update({
          where: { id: message.id },
          data: {
            status: "RETRYING",
            processingLockAt: null,
            nextRetryAt: new Date(Date.now() + delay),
            lastErrorCode: "TRANSIENT",
            lastErrorMessage: detail,
          },
        });
        retried += 1;
      }
    }
  }

  return { processed, sent, failed, retried };
}

export async function retryFailedEmail(messageId: string): Promise<boolean> {
  const updated = await prisma.emailMessage.updateMany({
    where: { id: messageId, status: "FAILED" },
    data: {
      status: "PENDING",
      nextRetryAt: new Date(),
      failedAt: null,
      lastErrorCode: null,
      lastErrorMessage: null,
      processingLockAt: null,
    },
  });

  return updated.count > 0;
}

export async function getEmailQueueStats() {
  const [pending, processing, failed, sentToday] = await Promise.all([
    prisma.emailMessage.count({
      where: { status: { in: ["PENDING", "RETRYING"] } },
    }),
    prisma.emailMessage.count({ where: { status: "PROCESSING" } }),
    prisma.emailMessage.count({ where: { status: "FAILED" } }),
    prisma.emailMessage.count({
      where: {
        status: { in: ["SENT", "DELIVERED"] },
        sentAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
  ]);

  return { pending, processing, failed, sentToday };
}

export type { EmailMessage };
