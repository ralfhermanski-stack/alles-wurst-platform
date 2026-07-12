/**
 * @file email-sender-service.ts
 */

import { prisma } from "@/lib/db/prisma";

import type { EmailCategory } from "@prisma/client";

export async function resolveSenderForCategory(category: EmailCategory) {
  const categoryConfig = await prisma.emailCategoryConfig.findUnique({
    where: { category },
  });

  if (categoryConfig?.defaultSenderId) {
    const configured = await prisma.emailSenderIdentity.findFirst({
      where: {
        id: categoryConfig.defaultSenderId,
        active: true,
        verified: true,
      },
      include: { providerConfig: true },
    });

    if (configured) {
      return configured;
    }
  }

  const sender = await prisma.emailSenderIdentity.findFirst({
    where: {
      active: true,
      verified: true,
      OR: [
        { allowedCategories: { has: category } },
        { defaultSender: true },
      ],
    },
    include: { providerConfig: true },
    orderBy: [{ defaultSender: "desc" }, { sortOrder: "asc" }],
  });

  return sender;
}

export async function listSenderIdentities() {
  return prisma.emailSenderIdentity.findMany({
    include: { providerConfig: true },
    orderBy: [{ sortOrder: "asc" }, { internalName: "asc" }],
  });
}

export async function listProviderConfigs() {
  return prisma.emailProviderConfig.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });
}
