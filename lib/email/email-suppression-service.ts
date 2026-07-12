/**
 * @file email-suppression-service.ts
 */

import { createHash } from "node:crypto";

import { prisma } from "@/lib/db/prisma";

import type { EmailSuppressionReason } from "@prisma/client";

export function hashRecipientEmail(email: string): string {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

export function maskRecipientEmail(email: string): string {
  const [local, domain] = email.split("@");

  if (!local || !domain) {
    return "***";
  }

  const visible = local.length <= 2 ? "*" : `${local.slice(0, 2)}***`;
  return `${visible}@${domain}`;
}

export async function isEmailSuppressed(email: string): Promise<boolean> {
  const hash = hashRecipientEmail(email);
  const row = await prisma.emailSuppression.findFirst({
    where: { emailHash: hash, active: true },
  });

  return !!row;
}

export async function suppressEmailAddress(input: {
  email: string;
  reason: EmailSuppressionReason;
  source: string;
}): Promise<void> {
  const emailHash = hashRecipientEmail(input.email);

  await prisma.emailSuppression.upsert({
    where: { emailHash },
    create: {
      emailHash,
      reason: input.reason,
      source: input.source,
      active: true,
    },
    update: {
      reason: input.reason,
      source: input.source,
      active: true,
      releasedAt: null,
    },
  });
}

export async function releaseEmailSuppression(email: string): Promise<void> {
  const emailHash = hashRecipientEmail(email);

  await prisma.emailSuppression.updateMany({
    where: { emailHash, active: true },
    data: { active: false, releasedAt: new Date() },
  });
}
