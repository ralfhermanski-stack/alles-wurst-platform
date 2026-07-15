/**
 * @file account-deletion-service.ts
 */

import { randomBytes } from "node:crypto";

import { prisma } from "@/lib/db/prisma";
import { createUserAccountMessage } from "@/lib/account/account-message-service";
import {
  formatMembershipDate,
  getEffectiveMembershipEnd,
} from "@/lib/membership/membership-period-utils";
import { scheduleMembershipCancelAtPeriodEnd } from "@/lib/membership/membership-renewal-service";
import { generateSupportTicketNumber } from "@/lib/support/support-ticket-number";

type DeletionPlanItem = {
  category: string;
  action: "delete" | "anonymize" | "retain" | "block";
  reason: string;
};

export async function buildAccountDeletionPlan(userId: string): Promise<{
  deletable: DeletionPlanItem[];
  anonymizable: DeletionPlanItem[];
  retained: DeletionPlanItem[];
  blocking: string[];
  activeMembershipEnd: Date | null;
}> {
  const [openWithdrawals, openTickets, activeMembership, pendingOrders] =
    await Promise.all([
      prisma.withdrawalRequest.count({
        where: {
          userId,
          status: { in: ["RECEIVED", "UNDER_REVIEW"] },
        },
      }),
      prisma.supportTicket.count({
        where: { userId, status: { in: ["open", "waiting_user"] } },
      }),
      prisma.membership.findFirst({
        where: { userId, status: "active" },
      }),
      prisma.accountingPosition.count({
        where: { userId, paymentStatus: "pending" },
      }),
    ]);

  const blocking: string[] = [];

  if (openWithdrawals > 0) {
    blocking.push("Offene Widerrufsanfragen");
  }

  if (openTickets > 0) {
    blocking.push("Offene Support-Tickets");
  }

  if (pendingOrders > 0) {
    blocking.push("Offene Zahlungen");
  }

  const activeMembershipEnd = activeMembership
    ? getEffectiveMembershipEnd(activeMembership)
    : null;

  return {
    deletable: [
      { category: "Profilbiografie", action: "delete", reason: "Optional" },
      { category: "Avatar", action: "delete", reason: "Optional" },
      {
        category: "Marketing-Einwilligungen",
        action: "delete",
        reason: "Optional",
      },
    ],
    anonymizable: [
      {
        category: "Forenbeiträge",
        action: "anonymize",
        reason: "Kontext erhalten",
      },
      {
        category: "Bewertungen",
        action: "anonymize",
        reason: "Kontext erhalten",
      },
      {
        category: "Challenge-Beiträge",
        action: "anonymize",
        reason: "Kontext erhalten",
      },
    ],
    retained: [
      {
        category: "Rechnungen",
        action: "retain",
        reason: "Aufbewahrungspflicht",
      },
      {
        category: "Buchhaltungsdaten",
        action: "retain",
        reason: "Aufbewahrungspflicht",
      },
      {
        category: "Vertragsnachweise",
        action: "retain",
        reason: "Aufbewahrungspflicht",
      },
      {
        category: "Widerrufsvorgänge",
        action: "retain",
        reason: "Rechtsnachweis",
      },
    ],
    blocking,
    activeMembershipEnd,
  };
}

async function createDeletionTicket(input: {
  userId: string;
  privacyRequestId: string;
  requestNumber: string;
  planSummary: string;
  blocking: string[];
}) {
  const category = await prisma.supportTicketCategory.findFirst({
    where: { slug: "datenschutz-loeschung", isActive: true },
  });

  if (!category) {
    return null;
  }

  const ticketNumber = await generateSupportTicketNumber();

  return prisma.supportTicket.create({
    data: {
      ticketNumber,
      userId: input.userId,
      categoryId: category.id,
      subject: `Kontolöschung ${input.requestNumber}`,
      priority: "important",
      status: "open",
      waitingOn: "admin",
      privacyRequestId: input.privacyRequestId,
      messages: {
        create: {
          authorUserId: input.userId,
          authorType: "user",
          body: [
            `Löschanfrage: ${input.requestNumber}`,
            input.planSummary,
            input.blocking.length
              ? `Blockierende Vorgänge: ${input.blocking.join(", ")}`
              : "Keine blockierenden Vorgänge",
          ].join("\n"),
          isReadByUser: true,
        },
      },
    },
  });
}

async function performImmediateAccountDeletion(input: {
  userId: string;
  privacyRequestId: string;
  retained: DeletionPlanItem[];
}): Promise<void> {
  const anonymizedEmail = `deleted+${randomBytes(8).toString("hex")}@deleted.local`;

  await prisma.$transaction(async (tx) => {
    await tx.membership.updateMany({
      where: { userId: input.userId, status: "active" },
      data: {
        status: "cancelled",
        autoRenewEnabled: false,
        endsAt: new Date(),
      },
    });

    await tx.userProfile.updateMany({
      where: { userId: input.userId },
      data: {
        firstName: "Gelöschter",
        lastName: "Benutzer",
        publicName: "Gelöschter Benutzer",
        bio: null,
        useBioAsForumSignature: false,
        phone: null,
        avatarStorageKey: null,
      },
    });

    await tx.forumPost.updateMany({
      where: { authorUserId: input.userId },
      data: { displayNameSnapshot: "Gelöschter Benutzer" },
    });

    await tx.user.update({
      where: { id: input.userId },
      data: {
        email: anonymizedEmail,
        passwordHash: null,
        accountStatus: "deactivated",
        deletedAt: new Date(),
      },
    });

    await tx.accountDataRetention.createMany({
      data: input.retained.map((item) => ({
        userId: input.userId,
        dataCategory: item.category,
        reasonCode: "legal_retention",
        legalReference: item.reason,
        restrictedAt: new Date(),
      })),
    });
  });

  await prisma.accountDeletionPlan.update({
    where: { privacyRequestId: input.privacyRequestId },
    data: {
      status: "COMPLETED",
      executedAt: new Date(),
      scheduledExecutionAt: null,
    },
  });

  await prisma.privacyRequest.update({
    where: { id: input.privacyRequestId },
    data: {
      status: "FULFILLED",
      completedAt: new Date(),
    },
  });

  await createUserAccountMessage({
    userId: input.userId,
    messageType: "privacy_deletion_completed",
    title: "Kontolöschung abgeschlossen",
    body: "Dein Konto wurde gesperrt. Löschbare Daten wurden entfernt, öffentliche Inhalte anonymisiert. Aufbewahrungspflichtige Daten bleiben geschützt gespeichert.",
    linkUrl: "/account/datenschutz",
  });
}

export async function executeAccountDeletionPlan(input: {
  userId: string;
  privacyRequestId: string;
  skipMembershipScheduling?: boolean;
}): Promise<void> {
  const plan = await buildAccountDeletionPlan(input.userId);

  const hasFutureMembership =
    plan.activeMembershipEnd != null &&
    plan.activeMembershipEnd.getTime() > Date.now();

  const shouldScheduleForMembershipEnd =
    hasFutureMembership && !input.skipMembershipScheduling;

  await prisma.accountDeletionPlan.upsert({
    where: { privacyRequestId: input.privacyRequestId },
    create: {
      privacyRequestId: input.privacyRequestId,
      userId: input.userId,
      status: plan.blocking.length
        ? "BLOCKED"
        : shouldScheduleForMembershipEnd
          ? "SCHEDULED"
          : "EXECUTING",
      deletableData: plan.deletable,
      anonymizableData: plan.anonymizable,
      retainedData: plan.retained,
      blockingItems: plan.blocking,
      scheduledExecutionAt: shouldScheduleForMembershipEnd
        ? plan.activeMembershipEnd
        : null,
      calculatedAt: new Date(),
    },
    update: {
      status: plan.blocking.length
        ? "BLOCKED"
        : shouldScheduleForMembershipEnd
          ? "SCHEDULED"
          : "EXECUTING",
      deletableData: plan.deletable,
      anonymizableData: plan.anonymizable,
      retainedData: plan.retained,
      blockingItems: plan.blocking,
      scheduledExecutionAt: shouldScheduleForMembershipEnd
        ? plan.activeMembershipEnd
        : null,
      calculatedAt: new Date(),
    },
  });

  const request = await prisma.privacyRequest.findUnique({
    where: { id: input.privacyRequestId },
  });

  if (request) {
    await createDeletionTicket({
      userId: input.userId,
      privacyRequestId: input.privacyRequestId,
      requestNumber: request.requestNumber,
      planSummary: shouldScheduleForMembershipEnd
        ? `Löschung geplant zum Mitgliedschafts-Ende (${formatMembershipDate(plan.activeMembershipEnd)})`
        : "Löschplan erstellt",
      blocking: plan.blocking,
    });
  }

  if (plan.blocking.length > 0) {
    await prisma.privacyRequest.update({
      where: { id: input.privacyRequestId },
      data: { status: "PARTIALLY_FULFILLED" },
    });

    await createUserAccountMessage({
      userId: input.userId,
      messageType: "privacy_deletion_blocked",
      title: "Löschung derzeit blockiert",
      body: `Deine Löschanfrage wurde gespeichert. Folgende Vorgänge müssen zuerst abgeschlossen werden: ${plan.blocking.join(", ")}`,
      linkUrl: "/account/datenschutz",
    });

    return;
  }

  if (shouldScheduleForMembershipEnd && plan.activeMembershipEnd) {
    await scheduleMembershipCancelAtPeriodEnd({
      userId: input.userId,
      reason: "account_deletion",
    });

    await prisma.privacyRequest.update({
      where: { id: input.privacyRequestId },
      data: { status: "UNDER_REVIEW" },
    });

    await createUserAccountMessage({
      userId: input.userId,
      messageType: "privacy_deletion_scheduled",
      title: "Kontolöschung geplant",
      body: `Deine Mitgliedschaft endet am ${formatMembershipDate(plan.activeMembershipEnd)} — es erfolgt keine Verlängerung. Dein Konto wird danach vollständig gelöscht. Bis dahin behältst du deinen bezahlten Zugang.`,
      linkUrl: "/account/datenschutz",
    });

    return;
  }

  await performImmediateAccountDeletion({
    userId: input.userId,
    privacyRequestId: input.privacyRequestId,
    retained: plan.retained,
  });
}
