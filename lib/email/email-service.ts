/**
 * @file email-service.ts
 * @purpose Zentrale Schnittstelle für den Plattform-E-Mail-Versand.
 */

import { prisma } from "@/lib/db/prisma";
import { wrapPlatformEmailHtml, htmlToPlainText } from "./email-layout";
import { isEmailCategoryEnabledForUser, isMarketingCategory } from "./email-preference-service";
import { resolveSenderForCategory } from "./email-sender-service";
import { resolveTemplateByKey } from "./email-template-service";
import { processEmailQueueBatch } from "./email-queue-service";
import {
  hashRecipientEmail,
  isEmailSuppressed,
  maskRecipientEmail,
} from "./email-suppression-service";
import type { TemplateVariables } from "./email-placeholder-service";

import type { EmailCategory, EmailPriority } from "@prisma/client";

export type PlatformEmailAttachment = {
  filename: string;
  mimeType: string;
  content: Buffer;
};

export type SendPlatformEmailInput = {
  category: EmailCategory;
  recipientEmail: string;
  recipientUserId?: string;
  templateKey?: string;
  subject?: string;
  html?: string;
  text?: string;
  variables?: TemplateVariables;
  attachments?: PlatformEmailAttachment[];
  relatedEntity?: { type: string; id: string };
  requestedByUserId?: string;
  priority?: EmailPriority;
  isTest?: boolean;
  immediate?: boolean;
  accountMessage?: {
    type: string;
    title: string;
    body: string;
    linkUrl?: string;
  };
};

export type SendPlatformEmailResult = {
  queued: boolean;
  messageId: string;
  sentImmediately: boolean;
  devMode?: boolean;
};

function normalizeRecipient(email: string): string {
  const trimmed = email.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    throw new Error("INVALID_RECIPIENT");
  }

  return trimmed;
}

function assertNoUserToUserEmail(input: SendPlatformEmailInput): void {
  if (!input.requestedByUserId || !input.recipientUserId) {
    return;
  }

  if (
    input.requestedByUserId === input.recipientUserId &&
    input.category !== "ADMIN_MANUAL"
  ) {
    return;
  }

  if (input.category === "ADMIN_MANUAL" && input.requestedByUserId) {
    return;
  }

  if (
    input.requestedByUserId &&
    input.recipientUserId &&
    input.requestedByUserId !== input.recipientUserId &&
    !input.isTest
  ) {
    const requesterIsStaff = false;
    void requesterIsStaff;
  }
}

export async function sendPlatformEmail(
  input: SendPlatformEmailInput,
): Promise<SendPlatformEmailResult> {
  const recipientEmail = normalizeRecipient(input.recipientEmail);
  assertNoUserToUserEmail(input);

  if (await isEmailSuppressed(recipientEmail)) {
    throw new Error("SUPPRESSED");
  }

  if (
    input.recipientUserId &&
    isMarketingCategory(input.category) &&
    !(await isEmailCategoryEnabledForUser({
      userId: input.recipientUserId,
      category: input.category,
    }))
  ) {
    throw new Error("MARKETING_BLOCKED");
  }

  const sender = await resolveSenderForCategory(input.category);

  if (sender && !sender.verified) {
    throw new Error("UNVERIFIED_SENDER");
  }

  let subject = input.subject ?? "";
  let html = input.html ?? "";
  let text = input.text ?? "";
  let templateVersionId: string | undefined;

  if (input.templateKey) {
    const resolved = await resolveTemplateByKey({
      templateKey: input.templateKey,
      variables: input.variables ?? {},
      senderName: sender?.displayName,
    });

    if (!resolved) {
      throw new Error("TEMPLATE_MISSING");
    }

    subject = resolved.subject;
    html = resolved.html;
    text = resolved.text;
    templateVersionId = resolved.templateVersionId;
  } else if (!subject || !html) {
    throw new Error("TEMPLATE_MISSING");
  } else if (!text) {
    html = wrapPlatformEmailHtml({
      content: html,
      senderName: sender?.displayName,
    });
    text = htmlToPlainText(html);
  }

  const categoryConfig = await prisma.emailCategoryConfig.findUnique({
    where: { category: input.category },
  });

  const priority = input.priority ?? categoryConfig?.defaultPriority ?? "NORMAL";
  const createAccountMessage =
    !!input.accountMessage ||
    (!!input.recipientUserId && categoryConfig?.alsoAccountMessage === true);

  const message = await prisma.emailMessage.create({
    data: {
      recipientUserId: input.recipientUserId ?? null,
      recipientEmail,
      recipientMasked: maskRecipientEmail(recipientEmail),
      senderIdentityId: sender?.id ?? null,
      providerConfigId: sender?.providerConfigId ?? null,
      templateVersionId: templateVersionId ?? null,
      category: input.category,
      subjectSnapshot: subject,
      htmlSnapshot: html,
      textSnapshot: text,
      status: "PENDING",
      priority,
      scheduledAt: new Date(),
      relatedEntityType: input.relatedEntity?.type ?? null,
      relatedEntityId: input.relatedEntity?.id ?? null,
      requestedByUserId: input.requestedByUserId ?? null,
      isTest: input.isTest ?? false,
      hasAttachments: (input.attachments?.length ?? 0) > 0,
      createAccountMessage,
      accountMessageType: input.accountMessage?.type ?? null,
      accountMessageTitle: input.accountMessage?.title ?? null,
      accountMessageBody: input.accountMessage?.body ?? null,
      accountMessageLink: input.accountMessage?.linkUrl ?? null,
    },
  });

  if (input.attachments?.length) {
    const { mkdir, writeFile } = await import("node:fs/promises");
    const path = await import("node:crypto");
    const nodePath = await import("node:path");
    const root = nodePath.join(process.cwd(), "storage", "email-attachments");

    for (const attachment of input.attachments) {
      const safeName = attachment.filename.replace(/[^a-zA-Z0-9äöüÄÖÜß._-]/g, "_");
      const storageKey = nodePath.posix.join(message.id, `${Date.now()}-${safeName}`);
      const absolute = nodePath.join(root, storageKey);
      await mkdir(nodePath.dirname(absolute), { recursive: true });
      await writeFile(absolute, attachment.content);

      await prisma.emailAttachment.create({
        data: {
          emailMessageId: message.id,
          filename: safeName,
          mimeType: attachment.mimeType,
          sizeBytes: attachment.content.length,
          storageKey,
          checksum: path
            .createHash("sha256")
            .update(attachment.content)
            .digest("hex"),
        },
      });
    }
  }

  const shouldSendNow =
    input.immediate !== false &&
    (priority === "CRITICAL" || priority === "HIGH" || input.immediate === true);

  if (shouldSendNow) {
    await processEmailQueueBatch();
  }

  const refreshed = await prisma.emailMessage.findUnique({
    where: { id: message.id },
    select: { status: true },
  });

  return {
    queued: true,
    messageId: message.id,
    sentImmediately: refreshed?.status === "SENT",
    devMode: process.env.NODE_ENV === "development",
  };
}

/**
 * Kompatibilitäts-Wrapper für bestehende sendMail()-Aufrufe.
 */
export async function sendLegacyMailMessage(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
  actionLink?: string;
  category?: EmailCategory;
  recipientUserId?: string;
  templateKey?: string;
  priority?: EmailPriority;
  accountMessage?: SendPlatformEmailInput["accountMessage"];
}): Promise<{ sent: boolean; devActionLink?: string; messageId?: string }> {
  try {
    const result = await sendPlatformEmail({
      category: input.category ?? "SYSTEM",
      recipientEmail: input.to,
      recipientUserId: input.recipientUserId,
      templateKey: input.templateKey,
      subject: input.subject,
      html: input.html,
      text: input.text,
      variables: input.actionLink ? { actionUrl: input.actionLink } : undefined,
      priority: input.priority ?? "HIGH",
      immediate: true,
      accountMessage: input.accountMessage,
    });

    return {
      sent: result.sentImmediately,
      devActionLink: input.actionLink,
      messageId: result.messageId,
    };
  } catch (error) {
    console.error("[email] Legacy-Versand fehlgeschlagen:", error);
    return { sent: false, devActionLink: input.actionLink };
  }
}

export { hashRecipientEmail, maskRecipientEmail };
