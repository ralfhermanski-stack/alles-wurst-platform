/**
 * @file membership-renewal-cron-service.ts
 * @purpose Tägliche Jobs: Erinnerungen, Ablauf, geplante Kontolöschungen.
 */

import { prisma } from "@/lib/db/prisma";
import { executeAccountDeletionPlan } from "@/lib/privacy/account-deletion-service";

import { runMembershipRenewalReminderBatch } from "./membership-renewal-service";

export async function runMembershipMaintenanceJobs(): Promise<{
  reminders: Awaited<ReturnType<typeof runMembershipRenewalReminderBatch>>;
  scheduledDeletions: number;
}> {
  const reminders = await runMembershipRenewalReminderBatch();
  const scheduledDeletions = await processScheduledAccountDeletions();

  return { reminders, scheduledDeletions };
}

async function processScheduledAccountDeletions(): Promise<number> {
  const now = new Date();

  const plans = await prisma.accountDeletionPlan.findMany({
    where: {
      status: "SCHEDULED",
      scheduledExecutionAt: { lte: now },
    },
    select: {
      privacyRequestId: true,
      userId: true,
    },
    take: 20,
  });

  let processed = 0;

  for (const plan of plans) {
    try {
      await prisma.accountDeletionPlan.update({
        where: { privacyRequestId: plan.privacyRequestId },
        data: { status: "EXECUTING" },
      });

      await executeAccountDeletionPlan({
        userId: plan.userId,
        privacyRequestId: plan.privacyRequestId,
        skipMembershipScheduling: true,
      });

      processed += 1;
    } catch (error) {
      console.error(
        `[membership/cron] Geplante Löschung fehlgeschlagen (${plan.userId}):`,
        error,
      );

      await prisma.accountDeletionPlan.update({
        where: { privacyRequestId: plan.privacyRequestId },
        data: { status: "FAILED" },
      });
    }
  }

  return processed;
}
