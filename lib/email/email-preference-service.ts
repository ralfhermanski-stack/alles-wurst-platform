/**
 * @file email-preference-service.ts
 */

import { prisma } from "@/lib/db/prisma";

import type { EmailCategory } from "@prisma/client";

const TRANSACTIONAL_CATEGORIES: EmailCategory[] = [
  "AUTH",
  "ACCOUNT",
  "SECURITY",
  "ORDER",
  "PAYMENT",
  "BILLING",
  "WITHDRAWAL",
  "PRIVACY",
  "TICKET",
  "SUPPORT",
  "SYSTEM",
];

const MARKETING_CATEGORIES: EmailCategory[] = [
  "NEWSLETTER",
  "CHALLENGE",
  "COMMUNITY",
];

export function isTransactionalCategory(category: EmailCategory): boolean {
  return TRANSACTIONAL_CATEGORIES.includes(category);
}

export function isMarketingCategory(category: EmailCategory): boolean {
  return MARKETING_CATEGORIES.includes(category);
}

export async function isEmailCategoryEnabledForUser(input: {
  userId: string;
  category: EmailCategory;
}): Promise<boolean> {
  if (isTransactionalCategory(input.category)) {
    return true;
  }

  const preference = await prisma.emailPreference.findUnique({
    where: {
      userId_category: {
        userId: input.userId,
        category: input.category,
      },
    },
  });

  return preference?.enabled ?? true;
}

export async function setEmailPreference(input: {
  userId: string;
  category: EmailCategory;
  enabled: boolean;
  source?: string;
}): Promise<void> {
  if (isTransactionalCategory(input.category)) {
    return;
  }

  await prisma.emailPreference.upsert({
    where: {
      userId_category: {
        userId: input.userId,
        category: input.category,
      },
    },
    create: {
      userId: input.userId,
      category: input.category,
      enabled: input.enabled,
      source: input.source ?? "user",
    },
    update: {
      enabled: input.enabled,
      source: input.source ?? "user",
    },
  });
}

export async function listUserEmailPreferences(userId: string) {
  return prisma.emailPreference.findMany({
    where: { userId },
    orderBy: { category: "asc" },
  });
}
