/**
 * @file membership-renewal-service.ts
 * @purpose Verlängerungshinweise, Kündigung zum Periodenende, Admin-Steuerung.
 */

import type {
  BillingPeriod,
  Membership,
  MembershipCancelReason,
  MembershipRenewalReminderStatus,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { MEMBERSHIP_ROLE_LABELS } from "@/lib/membership/membership-labels";
import { sendPlatformEmail } from "@/lib/email/email-service";
import { getAppBaseUrl } from "@/lib/stripe/stripe-config";
import { MEMBERSHIP_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/users/membership-labels";

import {
  BILLING_PERIOD_LABELS,
  MEMBERSHIP_CANCEL_REASON_LABELS,
} from "./membership-renewal-labels";
import {
  calendarDaysUntil,
  formatMembershipDate,
  getEffectiveMembershipEnd,
  isRecurringMembershipPeriod,
  resolveRenewalLeadDays,
} from "./membership-period-utils";
import {
  cancelStripeSubscriptionAtPeriodEnd,
  reactivateStripeSubscriptionRenewal,
} from "./membership-stripe-subscription-service";

export type MembershipRenewalOverviewEntry = {
  membershipId: string;
  userId: string;
  userEmail: string;
  userName: string;
  roleLabel: string;
  billingPeriod: BillingPeriod | null;
  billingPeriodLabel: string;
  status: string;
  paymentStatus: string;
  periodEndAt: string | null;
  daysUntilEnd: number | null;
  leadDays: number | null;
  reminderDueToday: boolean;
  autoRenewEnabled: boolean;
  cancelAtPeriodEnd: boolean;
  cancelReason: MembershipCancelReason | null;
  cancelReasonLabel: string | null;
  renewalRemindersSuppressed: boolean;
  lastReminderForPeriodEnd: string | null;
  accountDeactivated: boolean;
};

export type MembershipRenewalReminderLogEntry = {
  id: string;
  membershipId: string;
  userId: string;
  userEmail: string;
  billingPeriod: BillingPeriod;
  periodEndAt: string;
  leadDays: number;
  status: MembershipRenewalReminderStatus;
  skipReason: string | null;
  errorMessage: string | null;
  triggeredBy: string;
  sentAt: string | null;
  createdAt: string;
};

function shouldSendRenewalReminder(
  membership: Membership,
  periodEnd: Date,
  now: Date = new Date(),
): { eligible: boolean; leadDays: number | null; skipReason?: string } {
  if (membership.status !== "active") {
    return { eligible: false, leadDays: null, skipReason: "Mitgliedschaft nicht aktiv" };
  }

  if (!membership.autoRenewEnabled || membership.cancelAtPeriodEnd) {
    return {
      eligible: false,
      leadDays: null,
      skipReason: "Keine automatische Verlängerung",
    };
  }

  if (membership.renewalRemindersSuppressed) {
    return {
      eligible: false,
      leadDays: null,
      skipReason: "Erinnerungen admin-seitig unterdrückt",
    };
  }

  if (!isRecurringMembershipPeriod(membership.billingPeriod)) {
    return {
      eligible: false,
      leadDays: null,
      skipReason: "Keine wiederkehrende Abrechnung",
    };
  }

  const leadDays = resolveRenewalLeadDays(membership.billingPeriod);

  if (leadDays == null) {
    return { eligible: false, leadDays: null, skipReason: "Unbekannte Periode" };
  }

  const daysLeft = calendarDaysUntil(periodEnd, now);

  if (daysLeft !== leadDays) {
    return {
      eligible: false,
      leadDays,
      skipReason: `Noch ${daysLeft} Tage bis Periodenende (Frist: ${leadDays})`,
    };
  }

  if (
    membership.lastRenewalReminderForPeriodEnd &&
    membership.lastRenewalReminderForPeriodEnd.getTime() === periodEnd.getTime()
  ) {
    return {
      eligible: false,
      leadDays,
      skipReason: "Erinnerung für diese Periode bereits gesendet",
    };
  }

  return { eligible: true, leadDays };
}

async function resolveUserDisplayName(userId: string): Promise<{
  email: string;
  firstName: string;
  displayName: string;
  deactivated: boolean;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      accountStatus: true,
      deletedAt: true,
      profile: {
        select: {
          firstName: true,
          publicName: true,
        },
      },
    },
  });

  if (!user) {
    return {
      email: "",
      firstName: "Mitglied",
      displayName: "Mitglied",
      deactivated: true,
    };
  }

  const firstName = user.profile?.firstName?.trim() || "Mitglied";
  const displayName =
    user.profile?.publicName?.trim() ||
    user.profile?.firstName?.trim() ||
    user.email;

  return {
    email: user.email,
    firstName,
    displayName,
    deactivated:
      user.accountStatus === "deactivated" || user.deletedAt != null,
  };
}

export async function scheduleMembershipCancelAtPeriodEnd(input: {
  userId: string;
  reason: MembershipCancelReason;
  actorUserId?: string | null;
  skipStripe?: boolean;
}): Promise<{ success: boolean; periodEnd: Date | null; message: string }> {
  const membership = await prisma.membership.findUnique({
    where: { userId: input.userId },
  });

  if (!membership) {
    return {
      success: false,
      periodEnd: null,
      message: "Keine Mitgliedschaft vorhanden.",
    };
  }

  const periodEnd = getEffectiveMembershipEnd(membership);
  const now = new Date();

  if (!input.skipStripe) {
    await cancelStripeSubscriptionAtPeriodEnd({ userId: input.userId });
  }

  await prisma.membership.update({
    where: { id: membership.id },
    data: {
      autoRenewEnabled: false,
      cancelAtPeriodEnd: true,
      cancelReason: input.reason,
      cancelRequestedAt: now,
      renewalRemindersSuppressed: true,
      accountingNote: [
        membership.accountingNote?.trim(),
        `Verlängerung beendet (${MEMBERSHIP_CANCEL_REASON_LABELS[input.reason]}) am ${now.toISOString()}.`,
      ]
        .filter(Boolean)
        .join("\n"),
    },
  });

  return {
    success: true,
    periodEnd,
    message: periodEnd
      ? `Mitgliedschaft endet am ${formatMembershipDate(periodEnd)} — keine Verlängerung.`
      : "Mitgliedschaft wird nicht verlängert.",
  };
}

async function sendMembershipCancelConfirmation(input: {
  userId: string;
  periodEnd: Date | null;
  roleLabel: string;
}): Promise<void> {
  const user = await resolveUserDisplayName(input.userId);

  if (!user.email || user.deactivated) {
    return;
  }

  const endLabel = formatMembershipDate(input.periodEnd);
  const manageUrl = `${getAppBaseUrl()}/mein-bereich/mitgliedschaft`;

  await sendPlatformEmail({
    category: "MEMBERSHIP",
    recipientEmail: user.email,
    recipientUserId: input.userId,
    templateKey: "membership.cancel.confirm",
    subject: `Kündigung bestätigt — Zugang bis ${endLabel}`,
    html: `<p>Hallo ${user.firstName},</p>
<p>deine <strong>${input.roleLabel}</strong>-Mitgliedschaft wurde zum Periodenende gekündigt.</p>
<p>Dein Zugang bleibt bis <strong>${endLabel}</strong> aktiv. Es erfolgt keine weitere Verlängerung.</p>
<p><a href="${manageUrl}">Mitgliedschaft verwalten</a></p>`,
    text: `Hallo ${user.firstName},\n\nKündigung bestätigt. Zugang bis ${endLabel}.\n\n${manageUrl}\n`,
    variables: {
      firstName: user.firstName,
      roleLabel: input.roleLabel,
      periodEndLabel: endLabel,
      manageUrl,
    },
    accountMessage: {
      type: "membership_cancelled",
      title: "Mitgliedschaft gekündigt",
      body: `Dein Zugang endet am ${endLabel}. Es erfolgt keine Verlängerung.`,
      linkUrl: "/mein-bereich/mitgliedschaft",
    },
  });
}

export async function userCancelMembership(
  userId: string,
): Promise<{ success: boolean; message: string; periodEndLabel: string }> {
  const membership = await prisma.membership.findUnique({ where: { userId } });

  if (!membership || membership.status !== "active") {
    return {
      success: false,
      message: "Keine aktive Mitgliedschaft zum Kündigen.",
      periodEndLabel: "—",
    };
  }

  if (membership.cancelAtPeriodEnd) {
    const periodEnd = getEffectiveMembershipEnd(membership);
    return {
      success: false,
      message: "Die Kündigung ist bereits vorgemerkt.",
      periodEndLabel: formatMembershipDate(periodEnd),
    };
  }

  if (
    membership.billingPeriod !== "monthly" &&
    membership.billingPeriod !== "yearly"
  ) {
    return {
      success: false,
      message: "Diese Mitgliedschaft verlängert sich nicht automatisch.",
      periodEndLabel: "—",
    };
  }

  const result = await scheduleMembershipCancelAtPeriodEnd({
    userId,
    reason: "user_request",
  });

  if (!result.success) {
    return {
      success: false,
      message: result.message,
      periodEndLabel: "—",
    };
  }

  const roleLabel =
    MEMBERSHIP_ROLE_LABELS[
      membership.role as keyof typeof MEMBERSHIP_ROLE_LABELS
    ] ?? membership.role;

  await sendMembershipCancelConfirmation({
    userId,
    periodEnd: result.periodEnd,
    roleLabel,
  });

  return {
    success: true,
    message: result.message,
    periodEndLabel: formatMembershipDate(result.periodEnd),
  };
}

export async function userReactivateMembership(
  userId: string,
): Promise<{ success: boolean; message: string }> {
  const membership = await prisma.membership.findUnique({ where: { userId } });

  if (!membership?.cancelAtPeriodEnd) {
    return {
      success: false,
      message: "Es ist keine Kündigung zum Periodenende hinterlegt.",
    };
  }

  if (membership.cancelReason === "account_deletion") {
    return {
      success: false,
      message:
        "Die Kündigung hängt mit einer Kontolöschung zusammen und kann hier nicht widerrufen werden.",
    };
  }

  const periodEnd = getEffectiveMembershipEnd(membership);

  if (periodEnd && periodEnd.getTime() <= Date.now()) {
    return {
      success: false,
      message: "Die Laufzeit ist bereits abgelaufen.",
    };
  }

  const result = await reenableMembershipAutoRenew({
    userId,
    actorUserId: userId,
  });

  return { success: result.success, message: result.message };
}

export async function buildUserMembershipStatus(userId: string) {
  const membership = await prisma.membership.findUnique({
    where: { userId },
  });

  if (!membership) {
    return null;
  }

  const periodEnd = getEffectiveMembershipEnd(membership);
  const leadDays = resolveRenewalLeadDays(membership.billingPeriod);
  const isRecurring =
    membership.billingPeriod === "monthly" ||
    membership.billingPeriod === "yearly";
  const willRenew =
    membership.autoRenewEnabled &&
    !membership.cancelAtPeriodEnd &&
    membership.status === "active";

  return {
    roleLabel:
      MEMBERSHIP_ROLE_LABELS[
        membership.role as keyof typeof MEMBERSHIP_ROLE_LABELS
      ] ?? membership.role,
    billingPeriodLabel: membership.billingPeriod
      ? BILLING_PERIOD_LABELS[membership.billingPeriod]
      : null,
    periodEndLabel: formatMembershipDate(periodEnd),
    daysUntilEnd: periodEnd ? calendarDaysUntil(periodEnd) : null,
    leadDays,
    autoRenewEnabled: membership.autoRenewEnabled,
    cancelAtPeriodEnd: membership.cancelAtPeriodEnd,
    cancelReasonLabel: membership.cancelReason
      ? MEMBERSHIP_CANCEL_REASON_LABELS[membership.cancelReason]
      : null,
    willRenew,
    isRecurring,
    canCancel:
      membership.status === "active" &&
      isRecurring &&
      !membership.cancelAtPeriodEnd,
    canReactivate:
      membership.status === "active" &&
      membership.cancelAtPeriodEnd &&
      membership.cancelReason !== "account_deletion" &&
      (periodEnd == null || periodEnd.getTime() > Date.now()),
    statusLabel: MEMBERSHIP_STATUS_LABELS[membership.status],
    paymentStatusLabel: PAYMENT_STATUS_LABELS[membership.paymentStatus],
  };
}

export async function reenableMembershipAutoRenew(input: {
  userId: string;
  actorUserId: string;
}): Promise<{ success: boolean; message: string }> {
  const stripeResult = await reactivateStripeSubscriptionRenewal(input.userId);

  await prisma.membership.updateMany({
    where: { userId: input.userId },
    data: {
      autoRenewEnabled: true,
      cancelAtPeriodEnd: false,
      cancelReason: null,
      cancelRequestedAt: null,
      renewalRemindersSuppressed: false,
    },
  });

  if (!stripeResult.reactivated && stripeResult.error) {
    return {
      success: true,
      message: `Plattform aktualisiert. Stripe-Hinweis: ${stripeResult.error}`,
    };
  }

  return {
    success: true,
    message: "Automatische Verlängerung wieder aktiviert.",
  };
}

async function recordReminderLog(input: {
  membershipId: string;
  userId: string;
  billingPeriod: BillingPeriod;
  periodEndAt: Date;
  leadDays: number;
  status: MembershipRenewalReminderStatus;
  skipReason?: string | null;
  errorMessage?: string | null;
  triggeredBy?: string;
  actorUserId?: string | null;
  emailMessageId?: string | null;
  sentAt?: Date | null;
}): Promise<void> {
  try {
    await prisma.membershipRenewalReminderLog.create({
      data: {
        membershipId: input.membershipId,
        userId: input.userId,
        billingPeriod: input.billingPeriod,
        periodEndAt: input.periodEndAt,
        leadDays: input.leadDays,
        status: input.status,
        skipReason: input.skipReason ?? null,
        errorMessage: input.errorMessage ?? null,
        triggeredBy: input.triggeredBy ?? "cron",
        actorUserId: input.actorUserId ?? null,
        emailMessageId: input.emailMessageId ?? null,
        sentAt: input.sentAt ?? null,
      },
    });
  } catch (error) {
    console.error("[membership/renewal] Reminder-Log konnte nicht gespeichert werden:", error);
  }
}

export async function sendMembershipRenewalReminder(input: {
  membershipId: string;
  triggeredBy?: "cron" | "admin_manual";
  actorUserId?: string | null;
  force?: boolean;
}): Promise<{ success: boolean; status: MembershipRenewalReminderStatus; message: string }> {
  const membership = await prisma.membership.findUnique({
    where: { id: input.membershipId },
  });

  if (!membership) {
    return { success: false, status: "failed", message: "Mitgliedschaft nicht gefunden." };
  }

  const periodEnd = getEffectiveMembershipEnd(membership);

  if (!periodEnd) {
    await recordReminderLog({
      membershipId: membership.id,
      userId: membership.userId,
      billingPeriod: membership.billingPeriod ?? "monthly",
      periodEndAt: new Date(),
      leadDays: 0,
      status: "skipped",
      skipReason: "Kein Enddatum hinterlegt",
      triggeredBy: input.triggeredBy ?? "cron",
      actorUserId: input.actorUserId,
    });
    return { success: false, status: "skipped", message: "Kein Enddatum hinterlegt." };
  }

  const leadDays = resolveRenewalLeadDays(membership.billingPeriod) ?? 0;

  if (!input.force) {
    const check = shouldSendRenewalReminder(membership, periodEnd);

    if (!check.eligible) {
      await recordReminderLog({
        membershipId: membership.id,
        userId: membership.userId,
        billingPeriod: membership.billingPeriod ?? "monthly",
        periodEndAt: periodEnd,
        leadDays: check.leadDays ?? leadDays,
        status: "skipped",
        skipReason: check.skipReason,
        triggeredBy: input.triggeredBy ?? "cron",
        actorUserId: input.actorUserId,
      });
      return {
        success: false,
        status: "skipped",
        message: check.skipReason ?? "Nicht fällig",
      };
    }
  }

  const user = await resolveUserDisplayName(membership.userId);

  if (user.deactivated) {
    await recordReminderLog({
      membershipId: membership.id,
      userId: membership.userId,
      billingPeriod: membership.billingPeriod ?? "monthly",
      periodEndAt: periodEnd,
      leadDays,
      status: "skipped",
      skipReason: "Nutzerkonto deaktiviert",
      triggeredBy: input.triggeredBy ?? "cron",
      actorUserId: input.actorUserId,
    });
    return { success: false, status: "skipped", message: "Nutzerkonto deaktiviert." };
  }

  if (!user.email) {
    await recordReminderLog({
      membershipId: membership.id,
      userId: membership.userId,
      billingPeriod: membership.billingPeriod ?? "monthly",
      periodEndAt: periodEnd,
      leadDays,
      status: "failed",
      errorMessage: "Keine E-Mail-Adresse",
      triggeredBy: input.triggeredBy ?? "cron",
      actorUserId: input.actorUserId,
    });
    return { success: false, status: "failed", message: "Keine E-Mail-Adresse." };
  }

  const roleLabel =
    MEMBERSHIP_ROLE_LABELS[
      membership.role as keyof typeof MEMBERSHIP_ROLE_LABELS
    ] ?? membership.role;
  const periodLabel = membership.billingPeriod
    ? BILLING_PERIOD_LABELS[membership.billingPeriod]
    : "Mitgliedschaft";
  const renewalDate = formatMembershipDate(periodEnd);
  const manageUrl = `${getAppBaseUrl()}/mein-bereich/profil`;

  const subject = `Deine ${roleLabel}-Mitgliedschaft verlängert sich am ${renewalDate}`;
  const bodyHtml = `<p>Hallo ${user.firstName},</p>
<p>deine <strong>${roleLabel}</strong>-Mitgliedschaft (${periodLabel}) verlängert sich automatisch am <strong>${renewalDate}</strong>.</p>
<p>Du musst nichts tun, wenn du die Mitgliedschaft behalten möchtest. Wenn du nicht verlängern möchtest, kannst du bis zum Ablaufdatum kündigen.</p>
<p><a href="${manageUrl}">Mitgliedschaft verwalten</a></p>`;
  const bodyText = `Hallo ${user.firstName},\n\ndeine ${roleLabel}-Mitgliedschaft (${periodLabel}) verlängert sich automatisch am ${renewalDate}.\n\nMitgliedschaft verwalten: ${manageUrl}\n`;

  try {
    const emailResult = await sendPlatformEmail({
      category: "MEMBERSHIP",
      recipientEmail: user.email,
      recipientUserId: membership.userId,
      templateKey: "membership.renewal.notice",
      subject,
      html: bodyHtml,
      text: bodyText,
      variables: {
        firstName: user.firstName,
        roleLabel,
        periodLabel,
        renewalDate,
        manageUrl,
        leadDays: String(leadDays),
      },
      relatedEntity: { type: "membership", id: membership.id },
      accountMessage: {
        type: "membership_renewal_notice",
        title: subject,
        body: `Automatische Verlängerung am ${renewalDate}. Du kannst bis dahin kündigen.`,
        linkUrl: "/mein-bereich/profil",
      },
    });

    const sentAt = new Date();

    await prisma.membership.update({
      where: { id: membership.id },
      data: {
        lastRenewalReminderForPeriodEnd: periodEnd,
      },
    });

    await recordReminderLog({
      membershipId: membership.id,
      userId: membership.userId,
      billingPeriod: membership.billingPeriod ?? "monthly",
      periodEndAt: periodEnd,
      leadDays,
      status: "sent",
      triggeredBy: input.triggeredBy ?? "cron",
      actorUserId: input.actorUserId,
      emailMessageId: emailResult.messageId,
      sentAt,
    });

    return { success: true, status: "sent", message: "Verlängerungshinweis gesendet." };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "E-Mail-Versand fehlgeschlagen.";

    await recordReminderLog({
      membershipId: membership.id,
      userId: membership.userId,
      billingPeriod: membership.billingPeriod ?? "monthly",
      periodEndAt: periodEnd,
      leadDays,
      status: "failed",
      errorMessage: message,
      triggeredBy: input.triggeredBy ?? "cron",
      actorUserId: input.actorUserId,
    });

    return { success: false, status: "failed", message };
  }
}

export async function listMembershipRenewalOverview(): Promise<
  MembershipRenewalOverviewEntry[]
> {
  const memberships = await prisma.membership.findMany({
    where: {
      status: "active",
      role: { in: ["wurstclub", "meisterclub"] },
    },
    include: {
      user: {
        select: {
          email: true,
          accountStatus: true,
          deletedAt: true,
          profile: {
            select: { firstName: true, lastName: true, publicName: true },
          },
        },
      },
    },
    orderBy: [{ extendedUntil: "asc" }, { endsAt: "asc" }],
    take: 500,
  });

  const now = new Date();

  return memberships.map((membership) => {
    const periodEnd = getEffectiveMembershipEnd(membership);
    const leadDays = resolveRenewalLeadDays(membership.billingPeriod);
    const daysUntilEnd =
      periodEnd != null ? calendarDaysUntil(periodEnd, now) : null;
    const reminderCheck =
      periodEnd != null
        ? shouldSendRenewalReminder(membership, periodEnd, now)
        : { eligible: false, leadDays: null as number | null };

    const profile = membership.user.profile;
    const userName =
      profile?.publicName?.trim() ||
      [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
      membership.user.email;

    return {
      membershipId: membership.id,
      userId: membership.userId,
      userEmail: membership.user.email,
      userName,
      roleLabel:
        MEMBERSHIP_ROLE_LABELS[
          membership.role as keyof typeof MEMBERSHIP_ROLE_LABELS
        ] ?? membership.role,
      billingPeriod: membership.billingPeriod,
      billingPeriodLabel: membership.billingPeriod
        ? BILLING_PERIOD_LABELS[membership.billingPeriod]
        : "—",
      status: membership.status,
      paymentStatus: membership.paymentStatus,
      periodEndAt: periodEnd?.toISOString() ?? null,
      daysUntilEnd,
      leadDays,
      reminderDueToday: reminderCheck.eligible,
      autoRenewEnabled: membership.autoRenewEnabled,
      cancelAtPeriodEnd: membership.cancelAtPeriodEnd,
      cancelReason: membership.cancelReason,
      cancelReasonLabel: membership.cancelReason
        ? MEMBERSHIP_CANCEL_REASON_LABELS[membership.cancelReason]
        : null,
      renewalRemindersSuppressed: membership.renewalRemindersSuppressed,
      lastReminderForPeriodEnd:
        membership.lastRenewalReminderForPeriodEnd?.toISOString() ?? null,
      accountDeactivated:
        membership.user.accountStatus === "deactivated" ||
        membership.user.deletedAt != null,
    };
  });
}

export async function listMembershipRenewalReminderLogs(
  limit = 100,
): Promise<MembershipRenewalReminderLogEntry[]> {
  const logs = await prisma.membershipRenewalReminderLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: { select: { email: true } },
    },
  });

  return logs.map((log) => ({
    id: log.id,
    membershipId: log.membershipId,
    userId: log.userId,
    userEmail: log.user.email,
    billingPeriod: log.billingPeriod,
    periodEndAt: log.periodEndAt.toISOString(),
    leadDays: log.leadDays,
    status: log.status,
    skipReason: log.skipReason,
    errorMessage: log.errorMessage,
    triggeredBy: log.triggeredBy,
    sentAt: log.sentAt?.toISOString() ?? null,
    createdAt: log.createdAt.toISOString(),
  }));
}

export async function expireEndedMemberships(): Promise<number> {
  const now = new Date();

  const candidates = await prisma.membership.findMany({
    where: {
      status: "active",
      OR: [
        { extendedUntil: { lt: now } },
        {
          extendedUntil: null,
          endsAt: { lt: now },
        },
      ],
    },
    select: { id: true },
  });

  if (candidates.length === 0) {
    return 0;
  }

  const result = await prisma.membership.updateMany({
    where: { id: { in: candidates.map((row) => row.id) } },
    data: {
      status: "expired",
      autoRenewEnabled: false,
    },
  });

  return result.count;
}

export async function runMembershipRenewalReminderBatch(): Promise<{
  scanned: number;
  sent: number;
  skipped: number;
  failed: number;
  expired: number;
}> {
  const memberships = await prisma.membership.findMany({
    where: {
      status: "active",
      role: { in: ["wurstclub", "meisterclub"] },
      autoRenewEnabled: true,
      cancelAtPeriodEnd: false,
      renewalRemindersSuppressed: false,
      billingPeriod: { in: ["monthly", "yearly"] },
    },
  });

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const membership of memberships) {
    const periodEnd = getEffectiveMembershipEnd(membership);

    if (!periodEnd) {
      skipped += 1;
      continue;
    }

    const check = shouldSendRenewalReminder(membership, periodEnd);

    if (!check.eligible) {
      skipped += 1;
      continue;
    }

    const result = await sendMembershipRenewalReminder({
      membershipId: membership.id,
      triggeredBy: "cron",
    });

    if (result.status === "sent") {
      sent += 1;
    } else if (result.status === "failed") {
      failed += 1;
    } else {
      skipped += 1;
    }
  }

  const expired = await expireEndedMemberships();

  return {
    scanned: memberships.length,
    sent,
    skipped,
    failed,
    expired,
  };
}

export async function updateMembershipBillingFromCheckout(input: {
  userId: string;
  billingPeriod: BillingPeriod;
}): Promise<void> {
  const data: Prisma.MembershipUpdateInput = {
    billingPeriod: input.billingPeriod,
    autoRenewEnabled: isRecurringMembershipPeriod(input.billingPeriod),
    cancelAtPeriodEnd: false,
    cancelReason: null,
    cancelRequestedAt: null,
    renewalRemindersSuppressed: false,
    lastRenewalReminderForPeriodEnd: null,
  };

  await prisma.membership.updateMany({
    where: { userId: input.userId },
    data,
  });
}
