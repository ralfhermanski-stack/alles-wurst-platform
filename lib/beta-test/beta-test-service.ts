/**
 * @file beta-test-service.ts
 * @purpose Betatest-Einladungen und Tester-Aufträge.
 */

import { prisma } from "@/lib/db/prisma";
import {
  generatePlainToken,
  hashPlainToken,
  isTokenExpired,
  verifyPlainTokenHash,
} from "@/lib/auth/auth-token";
import { createUserAccountMessage } from "@/lib/account/account-message-service";
import { buildAppUrl } from "@/lib/mail/mail-service";
import { sendPlatformEmail } from "@/lib/email/email-service";
import { actionButtonHtml, wrapPlatformEmailHtml } from "@/lib/email/email-layout";

import type { BetaInviteStatus, BetaTaskStatus } from "@prisma/client";

/** Gültigkeit Betatest-Einladung: 14 Tage */
export const BETA_INVITE_TOKEN_TTL_MS = 14 * 24 * 60 * 60 * 1000;

export type BetaTaskInput = {
  title: string;
  description?: string | null;
  dueAt?: string | null;
};

export type BetaInviteListItem = {
  id: string;
  email: string;
  status: BetaInviteStatus;
  personalMessage: string | null;
  taskCount: number;
  openTaskCount: number;
  userId: string | null;
  userDisplayName: string | null;
  sentAt: string | null;
  acceptedAt: string | null;
  expiresAt: string;
  createdAt: string;
};

export type BetaInviteDetail = BetaInviteListItem & {
  tasks: Array<{
    id: string;
    title: string;
    description: string | null;
    status: BetaTaskStatus;
    dueAt: string | null;
    completedAt: string | null;
    sortOrder: number;
  }>;
};

export type BetaTesterTaskItem = {
  id: string;
  title: string;
  description: string | null;
  status: BetaTaskStatus;
  dueAt: string | null;
  completedAt: string | null;
  sortOrder: number;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function formatTaskListHtml(tasks: Array<{ title: string; description?: string | null }>): string {
  if (tasks.length === 0) {
    return "<p>Es wurden noch keine konkreten Aufträge hinterlegt — wir melden uns mit Details.</p>";
  }

  const items = tasks
    .map((task) => {
      const detail = task.description?.trim()
        ? `<br><span style="color:#9ca3af;font-size:14px;">${escapeHtml(task.description.trim())}</span>`
        : "";

      return `<li style="margin-bottom:8px;"><strong>${escapeHtml(task.title)}</strong>${detail}</li>`;
    })
    .join("");

  return `<p>Deine Aufträge für den Betatest:</p><ul style="padding-left:20px;">${items}</ul>`;
}

function formatTaskListText(tasks: Array<{ title: string; description?: string | null }>): string {
  if (tasks.length === 0) {
    return "Es wurden noch keine konkreten Aufträge hinterlegt.";
  }

  return tasks
    .map((task, index) => {
      const detail = task.description?.trim() ? `\n   ${task.description.trim()}` : "";
      return `${index + 1}. ${task.title}${detail}`;
    })
    .join("\n");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function mapInviteListItem(
  row: {
    id: string;
    email: string;
    status: BetaInviteStatus;
    personalMessage: string | null;
    userId: string | null;
    sentAt: Date | null;
    acceptedAt: Date | null;
    expiresAt: Date;
    createdAt: Date;
    user: { profile: { firstName: string; lastName: string; publicName: string | null } | null } | null;
    tasks: Array<{ status: BetaTaskStatus }>;
  },
): BetaInviteListItem {
  const openTaskCount = row.tasks.filter((task) => task.status === "OPEN").length;

  return {
    id: row.id,
    email: row.email,
    status: row.status,
    personalMessage: row.personalMessage,
    taskCount: row.tasks.length,
    openTaskCount,
    userId: row.userId,
    userDisplayName: row.user?.profile
      ? row.user.profile.publicName?.trim() ||
        `${row.user.profile.firstName} ${row.user.profile.lastName}`.trim()
      : null,
    sentAt: row.sentAt?.toISOString() ?? null,
    acceptedAt: row.acceptedAt?.toISOString() ?? null,
    expiresAt: row.expiresAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

async function findInviteByPlainToken(token: string) {
  const tokenHash = hashPlainToken(token);

  return prisma.betaInvite.findUnique({
    where: { tokenHash },
    include: {
      tasks: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
      user: { include: { profile: true } },
    },
  });
}

async function sendBetaInviteEmail(input: {
  inviteId: string;
  email: string;
  inviteUrl: string;
  personalMessage?: string | null;
  tasks: Array<{ title: string; description?: string | null }>;
  existingUser: boolean;
}): Promise<void> {
  const personalBlock = input.personalMessage?.trim()
    ? `<p>${escapeHtml(input.personalMessage.trim()).replaceAll("\n", "<br>")}</p>`
    : "";

  const intro = input.existingUser
    ? "<p>du wurdest zum geschlossenen Betatest von <strong>Alles Wurst</strong> eingeladen. Du hast bereits ein Konto — melde dich an und nimm die Einladung an.</p>"
    : "<p>du wurdest zum geschlossenen Betatest von <strong>Alles Wurst</strong> eingeladen. Erstelle dein Konto über den Button unten und teste die Plattform vor dem öffentlichen Start.</p>";

  const taskListHtml = formatTaskListHtml(input.tasks);
  const taskListText = formatTaskListText(input.tasks);

  const htmlBody = `<p>Hallo,</p>${intro}${personalBlock}${taskListHtml}${actionButtonHtml("Einladung annehmen", input.inviteUrl)}<p style="color:#9ca3af;font-size:14px;">Der Link ist 14 Tage gültig.</p>`;
  const textBody = `Hallo,\n\n${input.existingUser ? "Du wurdest zum Betatest eingeladen. Melde dich an und nimm die Einladung an." : "Du wurdest zum Betatest eingeladen. Erstelle dein Konto über den Link."}\n\n${taskListText}\n\nEinladung annehmen: ${input.inviteUrl}\n`;

  await sendPlatformEmail({
    category: "SYSTEM",
    recipientEmail: input.email,
    subject: "Einladung zum Betatest — Alles Wurst",
    html: wrapPlatformEmailHtml({ content: htmlBody }),
    text: textBody,
    priority: "HIGH",
    immediate: true,
  });

  await prisma.betaInvite.update({
    where: { id: input.inviteId },
    data: {
      status: "SENT",
      sentAt: new Date(),
    },
  });
}

export async function listBetaInvites(): Promise<BetaInviteListItem[]> {
  const rows = await prisma.betaInvite.findMany({
    include: {
      tasks: { select: { status: true } },
      user: { include: { profile: true } },
    },
    orderBy: [{ createdAt: "desc" }],
    take: 200,
  });

  return rows.map(mapInviteListItem);
}

export async function getBetaInviteDetail(inviteId: string): Promise<BetaInviteDetail | null> {
  const row = await prisma.betaInvite.findUnique({
    where: { id: inviteId },
    include: {
      tasks: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
      user: { include: { profile: true } },
    },
  });

  if (!row) {
    return null;
  }

  return {
    ...mapInviteListItem(row),
    tasks: row.tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      dueAt: task.dueAt?.toISOString() ?? null,
      completedAt: task.completedAt?.toISOString() ?? null,
      sortOrder: task.sortOrder,
    })),
  };
}

export async function createBetaInvite(input: {
  email: string;
  personalMessage?: string | null;
  tasks: BetaTaskInput[];
  invitedByUserId: string;
}): Promise<{ invite: BetaInviteDetail; inviteUrl: string }> {
  const email = input.email.trim();
  const emailNorm = normalizeEmail(email);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm)) {
    throw new Error("Ungültige E-Mail-Adresse.");
  }

  const pendingDuplicate = await prisma.betaInvite.findFirst({
    where: {
      emailNorm,
      status: { in: ["PENDING", "SENT"] },
      expiresAt: { gt: new Date() },
    },
  });

  if (pendingDuplicate) {
    throw new Error("Für diese E-Mail liegt bereits eine offene Einladung vor.");
  }

  const plainToken = generatePlainToken();
  const tokenHash = hashPlainToken(plainToken);
  const expiresAt = new Date(Date.now() + BETA_INVITE_TOKEN_TTL_MS);

  const existingUser = await prisma.user.findFirst({
    where: { email: emailNorm, deletedAt: null },
    select: { id: true },
  });

  const invite = await prisma.betaInvite.create({
    data: {
      email,
      emailNorm,
      tokenHash,
      invitedById: input.invitedByUserId,
      personalMessage: input.personalMessage?.trim() || null,
      expiresAt,
      status: "PENDING",
      tasks: {
        create: input.tasks
          .filter((task) => task.title.trim())
          .map((task, index) => ({
            title: task.title.trim(),
            description: task.description?.trim() || null,
            dueAt: task.dueAt ? new Date(task.dueAt) : null,
            sortOrder: index,
            assignedById: input.invitedByUserId,
            userId: existingUser?.id ?? null,
          })),
      },
      ...(existingUser ? { userId: existingUser.id } : {}),
    },
    include: {
      tasks: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
      user: { include: { profile: true } },
    },
  });

  const inviteUrl = buildAppUrl(`/einladung?token=${encodeURIComponent(plainToken)}`);

  await sendBetaInviteEmail({
    inviteId: invite.id,
    email,
    inviteUrl,
    personalMessage: input.personalMessage,
    tasks: invite.tasks,
    existingUser: Boolean(existingUser),
  });

  if (existingUser) {
    await applyBetaAccessForUser(existingUser.id, invite.id);
  }

  const detail = await getBetaInviteDetail(invite.id);

  if (!detail) {
    throw new Error("Einladung konnte nicht geladen werden.");
  }

  return { invite: detail, inviteUrl };
}

async function applyBetaAccessForUser(userId: string, inviteId: string): Promise<void> {
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { maintenanceBypass: true },
    }),
    prisma.betaTesterTask.updateMany({
      where: { inviteId },
      data: { userId },
    }),
    prisma.betaInvite.update({
      where: { id: inviteId },
      data: {
        userId,
        status: "ACCEPTED",
        acceptedAt: new Date(),
      },
    }),
  ]);
}

export async function resendBetaInvite(inviteId: string): Promise<void> {
  const invite = await prisma.betaInvite.findUnique({
    where: { id: inviteId },
    include: { tasks: true },
  });

  if (!invite) {
    throw new Error("Einladung nicht gefunden.");
  }

  if (invite.status === "REVOKED") {
    throw new Error("Widerrufene Einladungen können nicht erneut gesendet werden.");
  }

  if (invite.status === "ACCEPTED") {
    throw new Error("Angenommene Einladungen können nicht erneut gesendet werden.");
  }

  const plainToken = generatePlainToken();
  const tokenHash = hashPlainToken(plainToken);

  await prisma.betaInvite.update({
    where: { id: inviteId },
    data: {
      tokenHash,
      expiresAt: new Date(Date.now() + BETA_INVITE_TOKEN_TTL_MS),
      status: "PENDING",
    },
  });

  const inviteUrl = buildAppUrl(`/einladung?token=${encodeURIComponent(plainToken)}`);

  const existingUser = await prisma.user.findFirst({
    where: { email: invite.emailNorm, deletedAt: null },
    select: { id: true },
  });

  await sendBetaInviteEmail({
    inviteId: invite.id,
    email: invite.email,
    inviteUrl,
    personalMessage: invite.personalMessage,
    tasks: invite.tasks,
    existingUser: Boolean(existingUser),
  });
}

export async function revokeBetaInvite(inviteId: string): Promise<void> {
  await prisma.betaInvite.update({
    where: { id: inviteId },
    data: {
      status: "REVOKED",
      revokedAt: new Date(),
    },
  });
}

export async function addTasksToBetaInvite(input: {
  inviteId: string;
  tasks: BetaTaskInput[];
  assignedByUserId: string;
}): Promise<BetaInviteDetail> {
  const invite = await prisma.betaInvite.findUnique({
    where: { id: input.inviteId },
    include: { tasks: true },
  });

  if (!invite) {
    throw new Error("Einladung nicht gefunden.");
  }

  if (invite.status === "REVOKED") {
    throw new Error("Widerrufene Einladung kann nicht bearbeitet werden.");
  }

  const startOrder = invite.tasks.length;

  await prisma.betaTesterTask.createMany({
    data: input.tasks
      .filter((task) => task.title.trim())
      .map((task, index) => ({
        inviteId: invite.id,
        userId: invite.userId,
        assignedById: input.assignedByUserId,
        title: task.title.trim(),
        description: task.description?.trim() || null,
        dueAt: task.dueAt ? new Date(task.dueAt) : null,
        sortOrder: startOrder + index,
      })),
  });

  const detail = await getBetaInviteDetail(invite.id);

  if (!detail) {
    throw new Error("Einladung konnte nicht geladen werden.");
  }

  return detail;
}

export async function addTasksToBetaUser(input: {
  userId: string;
  tasks: BetaTaskInput[];
  assignedByUserId: string;
}): Promise<BetaTesterTaskItem[]> {
  const user = await prisma.user.findUnique({
    where: { id: input.userId, deletedAt: null },
    select: { id: true, maintenanceBypass: true },
  });

  if (!user) {
    throw new Error("Nutzer nicht gefunden.");
  }

  const existingCount = await prisma.betaTesterTask.count({
    where: { userId: input.userId },
  });

  const created = await prisma.$transaction(
    input.tasks
      .filter((task) => task.title.trim())
      .map((task, index) =>
        prisma.betaTesterTask.create({
          data: {
            userId: input.userId,
            assignedById: input.assignedByUserId,
            title: task.title.trim(),
            description: task.description?.trim() || null,
            dueAt: task.dueAt ? new Date(task.dueAt) : null,
            sortOrder: existingCount + index,
          },
        }),
      ),
  );

  if (!user.maintenanceBypass) {
    await prisma.user.update({
      where: { id: input.userId },
      data: { maintenanceBypass: true },
    });
  }

  return created.map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    dueAt: task.dueAt?.toISOString() ?? null,
    completedAt: task.completedAt?.toISOString() ?? null,
    sortOrder: task.sortOrder,
  }));
}

export async function getPublicInvitePreview(token: string): Promise<{
  email: string;
  personalMessage: string | null;
  tasks: Array<{ title: string; description: string | null }>;
  expired: boolean;
  revoked: boolean;
  accepted: boolean;
  existingAccount: boolean;
} | null> {
  const invite = await findInviteByPlainToken(token);

  if (!invite) {
    return null;
  }

  const existingAccount = Boolean(
    await prisma.user.findFirst({
      where: { email: invite.emailNorm, deletedAt: null },
      select: { id: true },
    }),
  );

  return {
    email: invite.email,
    personalMessage: invite.personalMessage,
    tasks: invite.tasks.map((task) => ({
      title: task.title,
      description: task.description,
    })),
    expired: isTokenExpired(invite.expiresAt),
    revoked: invite.status === "REVOKED",
    accepted: invite.status === "ACCEPTED",
    existingAccount,
  };
}

export async function acceptBetaInviteForUser(input: {
  token: string;
  userId: string;
}): Promise<{ ok: boolean; message: string }> {
  const invite = await findInviteByPlainToken(input.token);

  if (!invite) {
    return { ok: false, message: "Einladung nicht gefunden oder ungültig." };
  }

  if (invite.status === "REVOKED") {
    return { ok: false, message: "Diese Einladung wurde widerrufen." };
  }

  if (invite.status === "ACCEPTED" && invite.userId === input.userId) {
    return { ok: true, message: "Einladung wurde bereits angenommen." };
  }

  if (isTokenExpired(invite.expiresAt)) {
    await prisma.betaInvite.update({
      where: { id: invite.id },
      data: { status: "EXPIRED" },
    });

    return { ok: false, message: "Diese Einladung ist abgelaufen." };
  }

  const user = await prisma.user.findUnique({
    where: { id: input.userId, deletedAt: null },
    select: { id: true, email: true },
  });

  if (!user) {
    return { ok: false, message: "Nutzer nicht gefunden." };
  }

  if (normalizeEmail(user.email) !== invite.emailNorm) {
    return {
      ok: false,
      message: "Diese Einladung gilt nur für die eingeladene E-Mail-Adresse.",
    };
  }

  await applyBetaAccessForUser(user.id, invite.id);

  return { ok: true, message: "Willkommen im Betatest!" };
}

export async function acceptBetaInviteAfterRegistration(input: {
  token: string;
  userId: string;
  email: string;
}): Promise<void> {
  const invite = await findInviteByPlainToken(input.token);

  if (!invite) {
    return;
  }

  if (invite.status === "REVOKED" || isTokenExpired(invite.expiresAt)) {
    return;
  }

  if (normalizeEmail(input.email) !== invite.emailNorm) {
    throw new Error("Die Registrierungs-E-Mail stimmt nicht mit der Einladung überein.");
  }

  await applyBetaAccessForUser(input.userId, invite.id);
}

export async function listBetaTasksForUser(userId: string): Promise<BetaTesterTaskItem[]> {
  const tasks = await prisma.betaTesterTask.findMany({
    where: { userId },
    orderBy: [{ status: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return tasks.map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    dueAt: task.dueAt?.toISOString() ?? null,
    completedAt: task.completedAt?.toISOString() ?? null,
    sortOrder: task.sortOrder,
  }));
}

export async function completeBetaTaskForUser(input: {
  userId: string;
  taskId: string;
}): Promise<BetaTesterTaskItem | null> {
  const task = await prisma.betaTesterTask.findFirst({
    where: { id: input.taskId, userId: input.userId },
  });

  if (!task) {
    return null;
  }

  const updated = await prisma.betaTesterTask.update({
    where: { id: task.id },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
    },
  });

  return {
    id: updated.id,
    title: updated.title,
    description: updated.description,
    status: updated.status,
    dueAt: updated.dueAt?.toISOString() ?? null,
    completedAt: updated.completedAt?.toISOString() ?? null,
    sortOrder: updated.sortOrder,
  };
}

export async function reopenBetaTaskForUser(input: {
  userId: string;
  taskId: string;
}): Promise<BetaTesterTaskItem | null> {
  const task = await prisma.betaTesterTask.findFirst({
    where: { id: input.taskId, userId: input.userId },
  });

  if (!task) {
    return null;
  }

  const updated = await prisma.betaTesterTask.update({
    where: { id: task.id },
    data: {
      status: "OPEN",
      completedAt: null,
    },
  });

  return {
    id: updated.id,
    title: updated.title,
    description: updated.description,
    status: updated.status,
    dueAt: updated.dueAt?.toISOString() ?? null,
    completedAt: updated.completedAt?.toISOString() ?? null,
    sortOrder: updated.sortOrder,
  };
}

export type BetaBroadcastAudience = "accepted" | "invited";

export type BetaBroadcastResult = {
  recipientCount: number;
  emailQueued: number;
  accountMessagesCreated: number;
  skippedNoAccount: number;
};

type BetaBroadcastRecipient = {
  email: string;
  userId: string | null;
  firstName: string | null;
};

function resolveBroadcastAudienceFilter(audience: BetaBroadcastAudience) {
  if (audience === "accepted") {
    return { status: "ACCEPTED" as const };
  }

  return { status: { in: ["SENT", "ACCEPTED"] as BetaInviteStatus[] } };
}

async function listBetaBroadcastRecipients(
  audience: BetaBroadcastAudience,
): Promise<BetaBroadcastRecipient[]> {
  const rows = await prisma.betaInvite.findMany({
    where: resolveBroadcastAudienceFilter(audience),
    include: {
      user: {
        include: {
          profile: {
            select: { firstName: true },
          },
        },
      },
    },
    orderBy: [{ createdAt: "desc" }],
  });

  const seen = new Set<string>();
  const recipients: BetaBroadcastRecipient[] = [];

  for (const row of rows) {
    const key = normalizeEmail(row.email);

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    recipients.push({
      email: row.email,
      userId: row.userId,
      firstName: row.user?.profile?.firstName?.trim() || null,
    });
  }

  return recipients;
}

export async function countBetaBroadcastRecipients(
  audience: BetaBroadcastAudience,
): Promise<number> {
  const recipients = await listBetaBroadcastRecipients(audience);
  return recipients.length;
}

function formatBroadcastGreeting(firstName: string | null): string {
  return firstName ? `Hallo ${escapeHtml(firstName)},` : "Hallo,";
}

function formatBroadcastGreetingText(firstName: string | null): string {
  return firstName ? `Hallo ${firstName},` : "Hallo,";
}

export async function sendBetaBroadcastMessage(input: {
  subject: string;
  message: string;
  audience: BetaBroadcastAudience;
  sendEmail: boolean;
  sendAccountMessage: boolean;
  requestedByUserId: string;
}): Promise<BetaBroadcastResult> {
  const subject = input.subject.trim();
  const message = input.message.trim();

  if (!subject) {
    throw new Error("Betreff ist erforderlich.");
  }

  if (!message) {
    throw new Error("Nachricht ist erforderlich.");
  }

  if (!input.sendEmail && !input.sendAccountMessage) {
    throw new Error("Mindestens ein Versandkanal muss ausgewählt sein.");
  }

  const recipients = await listBetaBroadcastRecipients(input.audience);
  const accountTitle = subject;
  const accountBody = message;
  const accountLink = "/mein-bereich/betatest";

  let emailQueued = 0;
  let accountMessagesCreated = 0;
  let skippedNoAccount = 0;

  for (const recipient of recipients) {
    if (input.sendEmail) {
      const greeting = formatBroadcastGreeting(recipient.firstName);
      const greetingText = formatBroadcastGreetingText(recipient.firstName);
      const messageHtml = escapeHtml(message).replaceAll("\n", "<br>");
      const htmlBody = `<p>${greeting}</p><p>${messageHtml}</p><p style="color:#9ca3af;font-size:14px;">— Das Team von Alles Wurst</p>`;
      const textBody = `${greetingText}\n\n${message}\n\n— Das Team von Alles Wurst\n`;

      try {
        await sendPlatformEmail({
          category: "SYSTEM",
          recipientEmail: recipient.email,
          recipientUserId: recipient.userId ?? undefined,
          subject,
          html: wrapPlatformEmailHtml({
            content: htmlBody,
            automatedNotice: false,
          }),
          text: textBody,
          priority: "NORMAL",
          requestedByUserId: input.requestedByUserId,
          relatedEntity: { type: "beta_broadcast", id: input.requestedByUserId },
          ...(input.sendAccountMessage && recipient.userId
            ? {
                accountMessage: {
                  type: "beta_broadcast",
                  title: accountTitle,
                  body: accountBody,
                  linkUrl: accountLink,
                },
              }
            : {}),
        });
        emailQueued += 1;

        if (input.sendAccountMessage) {
          if (recipient.userId) {
            accountMessagesCreated += 1;
          } else {
            skippedNoAccount += 1;
          }
        }
      } catch (error) {
        if (error instanceof Error && error.message === "SUPPRESSED") {
          continue;
        }

        throw error;
      }
    } else if (input.sendAccountMessage) {
      if (!recipient.userId) {
        skippedNoAccount += 1;
        continue;
      }

      await createUserAccountMessage({
        userId: recipient.userId,
        messageType: "beta_broadcast",
        title: accountTitle,
        body: accountBody,
        linkUrl: accountLink,
      });
      accountMessagesCreated += 1;
    }
  }

  return {
    recipientCount: recipients.length,
    emailQueued,
    accountMessagesCreated,
    skippedNoAccount,
  };
}

export async function verifyInviteTokenForRegistration(
  token: string,
  email: string,
): Promise<{ ok: boolean; message?: string }> {
  const invite = await findInviteByPlainToken(token);

  if (!invite) {
    return { ok: false, message: "Einladung ungültig." };
  }

  if (invite.status === "REVOKED") {
    return { ok: false, message: "Einladung widerrufen." };
  }

  if (isTokenExpired(invite.expiresAt)) {
    return { ok: false, message: "Einladung abgelaufen." };
  }

  if (normalizeEmail(email) !== invite.emailNorm) {
    return {
      ok: false,
      message: "Registriere dich mit der eingeladenen E-Mail-Adresse.",
    };
  }

  return { ok: true };
}
