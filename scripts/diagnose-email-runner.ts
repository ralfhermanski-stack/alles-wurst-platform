/**
 * @file diagnose-email-runner.ts
 * Diagnose E-Mail-Provider und Warteschlange (ohne Secrets).
 *
 * Aufruf: npx tsx scripts/diagnose-email-runner.ts
 */

import { prisma } from "@/lib/db/prisma";

async function main(): Promise<void> {
  const providers = await prisma.emailProviderConfig.findMany({
    select: {
      id: true,
      name: true,
      providerType: true,
      active: true,
      settings: true,
      connectionStatus: true,
      lastErrorMessage: true,
      lastSuccessfulSendAt: true,
      encryptedCredentials: true,
    },
  });

  const senders = await prisma.emailSenderIdentity.findMany({
    select: {
      id: true,
      displayName: true,
      emailAddress: true,
      active: true,
      verified: true,
      defaultSender: true,
      providerConfigId: true,
      lastError: true,
      lastSuccessfulSendAt: true,
    },
  });

  const stats = await prisma.emailMessage.groupBy({
    by: ["status"],
    _count: true,
  });

  const recentFailed = await prisma.emailMessage.findMany({
    where: { status: "FAILED" },
    orderBy: { updatedAt: "desc" },
    take: 8,
    select: {
      subjectSnapshot: true,
      recipientEmail: true,
      lastErrorMessage: true,
      lastErrorCode: true,
      updatedAt: true,
      attempts: true,
    },
  });

  const pending = await prisma.emailMessage.findMany({
    where: { status: { in: ["PENDING", "RETRYING"] } },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      subjectSnapshot: true,
      recipientEmail: true,
      status: true,
      createdAt: true,
      nextRetryAt: true,
    },
  });

  const envCheck = {
    MAIL_PROVIDER: process.env.MAIL_PROVIDER ? "gesetzt" : "fehlt",
    SMTP_HOST: process.env.SMTP_HOST ? "gesetzt" : "fehlt",
    SMTP_USER: process.env.SMTP_USER ? "gesetzt" : "fehlt",
    SMTP_PASS: process.env.SMTP_PASS ? "gesetzt" : "fehlt",
    MAIL_FROM: process.env.MAIL_FROM ?? "fehlt",
    EMAIL_CRON_SECRET: process.env.EMAIL_CRON_SECRET ? "gesetzt" : "fehlt",
    NODE_ENV: process.env.NODE_ENV ?? "unknown",
  };

  console.log(
    JSON.stringify(
      {
        envCheck,
        providers: providers.map((p) => ({
          ...p,
          hasCredentials: Boolean(p.encryptedCredentials),
          encryptedCredentials: p.encryptedCredentials ? "[vorhanden]" : null,
        })),
        senders,
        queueStats: stats,
        pending,
        recentFailed,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
