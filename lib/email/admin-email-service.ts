/**
 * @file admin-email-service.ts
 */

import { prisma } from "@/lib/db/prisma";
import { encryptEmailCredentialPayload, maskSecret } from "./email-crypto";
import { getEmailQueueStats } from "./email-queue-service";
import { listSenderIdentities, listProviderConfigs } from "./email-sender-service";
import {
  createEmailTemplate,
  getTemplateDetailForAdmin,
  listEmailTemplates,
  listTemplatesForAdmin,
  updateEmailTemplate,
} from "./email-template-service";
import { buildTestTemplateVariables } from "./email-placeholder-service";
import { ensureEmailSystemDefaults } from "./email-bootstrap";

import type { EmailCategory, EmailProviderType, Prisma } from "@prisma/client";

export async function getAdminEmailDashboard() {
  await ensureEmailSystemDefaults();

  const [queue, providers, senders, failed, bounced, unverifiedSenders] =
    await Promise.all([
      getEmailQueueStats(),
      listProviderConfigs(),
      listSenderIdentities(),
      prisma.emailMessage.count({ where: { status: "FAILED" } }),
      prisma.emailSuppression.count({ where: { active: true } }),
      prisma.emailSenderIdentity.count({ where: { active: true, verified: false } }),
    ]);

  const activeProvider = providers.find((row) => row.active);

  return {
    queue,
    providers: providers.map((row) => ({
      id: row.id,
      name: row.name,
      providerType: row.providerType,
      active: row.active,
      lastTestStatus: row.lastTestStatus,
      lastTestedAt: row.lastTestedAt?.toISOString() ?? null,
      hasCredentials: !!row.encryptedCredentials,
      credentialsMasked: row.encryptedCredentials ? "••••••••" : null,
      lastError: row.lastError,
    })),
    senders: senders.map((row) => ({
      id: row.id,
      internalName: row.internalName,
      displayName: row.displayName,
      emailAddress: row.emailAddress,
      replyToAddress: row.replyToAddress,
      active: row.active,
      verified: row.verified,
      defaultSender: row.defaultSender,
      allowedCategories: row.allowedCategories,
      lastSuccessfulSendAt: row.lastSuccessfulSendAt?.toISOString() ?? null,
      lastError: row.lastError,
    })),
    warnings: [
      !activeProvider
        ? "Der E-Mail-Provider ist nicht eingerichtet."
        : null,
      unverifiedSenders > 0
        ? `${unverifiedSenders} Absenderadresse(n) sind nicht verifiziert.`
        : null,
      queue.pending > 0 && queue.processing === 0
        ? `Es befinden sich ${queue.pending} E-Mails in der Warteschlange.`
        : null,
      failed > 0 ? `${failed} fehlgeschlagene E-Mails.` : null,
      bounced > 0 ? `${bounced} gesperrte Empfängeradressen.` : null,
    ].filter(Boolean),
    stats: {
      failed,
      bounced,
      unverifiedSenders,
    },
  };
}

export async function listEmailLogs(input?: {
  status?: string;
  category?: EmailCategory;
  limit?: number;
}) {
  const rows = await prisma.emailMessage.findMany({
    where: {
      ...(input?.status ? { status: input.status as never } : {}),
      ...(input?.category ? { category: input.category } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: input?.limit ?? 100,
    select: {
      id: true,
      recipientMasked: true,
      recipientUserId: true,
      category: true,
      subjectSnapshot: true,
      status: true,
      priority: true,
      attempts: true,
      lastErrorMessage: true,
      sentAt: true,
      failedAt: true,
      hasAttachments: true,
      isTest: true,
      createdAt: true,
      requestedByUserId: true,
      relatedEntityType: true,
      relatedEntityId: true,
    },
  });

  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
    sentAt: row.sentAt?.toISOString() ?? null,
    failedAt: row.failedAt?.toISOString() ?? null,
  }));
}

export async function listProvidersForAdmin() {
  const rows = await listProviderConfigs();

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    providerType: row.providerType,
    active: row.active,
    settings: row.settings as Record<string, unknown>,
    hasCredentials: !!row.encryptedCredentials,
    credentialsMasked: row.encryptedCredentials ? "••••••••••••" : null,
    lastTestedAt: row.lastTestedAt?.toISOString() ?? null,
    lastTestStatus: row.lastTestStatus,
    lastError: row.lastError,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
}

export async function listSendersForAdmin() {
  const rows = await listSenderIdentities();

  return rows.map((row) => ({
    id: row.id,
    providerConfigId: row.providerConfigId,
    providerName: row.providerConfig.name,
    internalName: row.internalName,
    displayName: row.displayName,
    emailAddress: row.emailAddress,
    replyToAddress: row.replyToAddress,
    active: row.active,
    verified: row.verified,
    defaultSender: row.defaultSender,
    allowedCategories: row.allowedCategories,
    sortOrder: row.sortOrder,
    dkimStatus: row.dkimStatus,
    spfStatus: row.spfStatus,
    dmarcStatus: row.dmarcStatus,
    lastTestedAt: row.lastTestedAt?.toISOString() ?? null,
    lastSuccessfulSendAt: row.lastSuccessfulSendAt?.toISOString() ?? null,
    lastError: row.lastError,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
}

export async function listCategoryConfigsForAdmin() {
  await ensureEmailSystemDefaults();

  const rows = await prisma.emailCategoryConfig.findMany({
    orderBy: { category: "asc" },
  });

  return rows.map((row) => ({
    id: row.id,
    category: row.category,
    defaultSenderId: row.defaultSenderId,
    defaultReplyTo: row.defaultReplyTo,
    defaultPriority: row.defaultPriority,
    transactional: row.transactional,
    marketing: row.marketing,
    attachmentsAllowed: row.attachmentsAllowed,
    alsoAccountMessage: row.alsoAccountMessage,
  }));
}

export async function updateCategoryDefaultSender(input: {
  category: EmailCategory;
  defaultSenderId: string | null;
}) {
  return prisma.emailCategoryConfig.update({
    where: { category: input.category },
    data: { defaultSenderId: input.defaultSenderId },
  });
}

export async function testEmailProviderConnection(input: {
  providerId: string;
  testRecipientEmail: string;
}): Promise<{ ok: boolean; message: string }> {
  const provider = await prisma.emailProviderConfig.findUnique({
    where: { id: input.providerId },
  });

  if (!provider) {
    return { ok: false, message: "Provider nicht gefunden." };
  }

  const sender = await prisma.emailSenderIdentity.findFirst({
    where: { providerConfigId: provider.id, active: true, verified: true },
  });

  if (!sender && provider.providerType !== "DEV") {
    return {
      ok: false,
      message: "Kein aktiver, verifizierter Absender für diesen Provider vorhanden.",
    };
  }

  try {
    const { sendPlatformEmail } = await import("./email-service");

    await sendPlatformEmail({
      category: "SYSTEM",
      recipientEmail: input.testRecipientEmail,
      templateKey: "auth.verify",
      variables: {
        firstName: "Test",
        verificationUrl: "https://example.test/verify",
      },
      priority: "HIGH",
      isTest: true,
      immediate: true,
    });

    await prisma.emailProviderConfig.update({
      where: { id: provider.id },
      data: {
        lastTestedAt: new Date(),
        lastTestStatus: "OK",
        lastError: null,
      },
    });

    return { ok: true, message: "Test-E-Mail wurde in die Warteschlange aufgenommen." };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Verbindungstest fehlgeschlagen.";

    await prisma.emailProviderConfig.update({
      where: { id: provider.id },
      data: {
        lastTestedAt: new Date(),
        lastTestStatus: "FAILED",
        lastError: message,
      },
    });

    return { ok: false, message };
  }
}

export async function upsertEmailProvider(input: {
  id?: string;
  providerType: EmailProviderType;
  name: string;
  active?: boolean;
  settings?: Record<string, unknown>;
  apiKey?: string;
  smtpPassword?: string;
}) {
  const encryptedCredentials =
    input.apiKey || input.smtpPassword
      ? encryptEmailCredentialPayload(
          JSON.stringify({
            apiKey: input.apiKey,
            password: input.smtpPassword,
          }),
        )
      : undefined;

  if (input.id) {
    return prisma.emailProviderConfig.update({
      where: { id: input.id },
      data: {
        providerType: input.providerType,
        name: input.name,
        active: input.active ?? true,
        settings: (input.settings ?? {}) as Prisma.InputJsonValue,
        ...(encryptedCredentials ? { encryptedCredentials } : {}),
      },
    });
  }

  return prisma.emailProviderConfig.create({
    data: {
      providerType: input.providerType,
      name: input.name,
      active: input.active ?? false,
      settings: (input.settings ?? {}) as Prisma.InputJsonValue,
      encryptedCredentials: encryptedCredentials ?? null,
    },
  });
}

export async function upsertEmailSender(input: {
  id?: string;
  providerConfigId: string;
  internalName: string;
  displayName: string;
  emailAddress: string;
  replyToAddress?: string;
  active?: boolean;
  verified?: boolean;
  defaultSender?: boolean;
  allowedCategories?: EmailCategory[];
  sortOrder?: number;
}) {
  if (input.defaultSender) {
    await prisma.emailSenderIdentity.updateMany({
      data: { defaultSender: false },
      where: { defaultSender: true },
    });
  }

  if (input.id) {
    return prisma.emailSenderIdentity.update({
      where: { id: input.id },
      data: {
        providerConfigId: input.providerConfigId,
        internalName: input.internalName,
        displayName: input.displayName,
        emailAddress: input.emailAddress,
        replyToAddress: input.replyToAddress,
        active: input.active,
        verified: input.verified,
        defaultSender: input.defaultSender,
        allowedCategories: input.allowedCategories,
        sortOrder: input.sortOrder,
      },
    });
  }

  return prisma.emailSenderIdentity.create({ data: input });
}

export async function sendAdminTestEmail(input: {
  recipientEmail: string;
  templateKey?: string;
  senderId?: string;
  requestedByUserId: string;
}) {
  const templateKey = input.templateKey ?? "auth.verify";
  const template = await prisma.emailTemplate.findUnique({
    where: { key: templateKey },
    include: { activeVersion: true },
  });

  const allowedVariables = Array.isArray(template?.activeVersion?.allowedVariables)
    ? (template.activeVersion.allowedVariables as string[])
    : [];

  const { sendPlatformEmail } = await import("./email-service");

  return sendPlatformEmail({
    category: template?.category ?? "SYSTEM",
    recipientEmail: input.recipientEmail,
    templateKey,
    variables: buildTestTemplateVariables(allowedVariables),
    requestedByUserId: input.requestedByUserId,
    priority: "HIGH",
    isTest: true,
    immediate: true,
  });
}

export async function sendStaffManualEmail(input: {
  recipientUserId: string;
  category: EmailCategory;
  templateKey: string;
  variables?: Record<string, string>;
  requestedByUserId: string;
}) {
  const user = await prisma.user.findUnique({
    where: { id: input.recipientUserId },
    select: { email: true, profile: { select: { firstName: true, publicName: true } } },
  });

  if (!user?.email) {
    throw new Error("Empfänger nicht gefunden.");
  }

  const { sendPlatformEmail } = await import("./email-service");

  return sendPlatformEmail({
    category: input.category,
    recipientEmail: user.email,
    recipientUserId: input.recipientUserId,
    templateKey: input.templateKey,
    variables: {
      firstName: user.profile?.firstName ?? user.profile?.publicName ?? "",
      ...input.variables,
    },
    requestedByUserId: input.requestedByUserId,
    priority: "NORMAL",
    immediate: true,
  });
}

export {
  createEmailTemplate,
  getTemplateDetailForAdmin,
  listEmailTemplates,
  listTemplatesForAdmin,
  maskSecret,
  updateEmailTemplate,
};
