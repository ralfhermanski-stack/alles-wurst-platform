/**
 * @file support-ticket-service.ts
 * @purpose Kernlogik für Support-Tickets.
 */

import type {
  Prisma,
  SupportTicket,
  SupportTicketEventType,
  SupportTicketPriority,
  SupportTicketStatus,
  UserSystemRole,
} from "@prisma/client";

import { MEISTER_SUPPORT_CATEGORY_SLUG } from "@/lib/help/help-hub-config";
import { prisma } from "@/lib/db/prisma";
import { buildAppUrl } from "@/lib/mail/mail-service";
import { getUserMembershipRole, hasMeisterclubAccess } from "@/lib/help/help-membership";
import { getKnowledgeBaseDraftCount } from "@/lib/knowledge-base/knowledge-base-service";
import { getPublicUserName } from "@/lib/users/public-user";
import {
  userFailure,
  userSuccess,
  type UserServiceResult,
} from "@/lib/users/user-errors";

import {
  buildSupportTicketWhere,
  processSupportEscalations,
} from "./support-escalation-service";
import {
  canManageAllTickets,
  canReadTicketAsStaff,
  canReadTicketAsUser,
  canWriteTicketAsStaff,
  canWriteTicketAsUser,
  isSupportStaffRole,
} from "./support-permissions";
import { generateSupportTicketNumber } from "./support-ticket-number";
import type {
  CreateSupportTicketInput,
  SupportAttachmentEntry,
  SupportCategoryEntry,
  SupportDashboardStats,
  SupportEventEntry,
  SupportInboxSummary,
  SupportInternalNoteEntry,
  SupportMessageEntry,
  SupportStaffEntry,
  SupportTemplateEntry,
  SupportTicketDetail,
  SupportTicketListFilters,
  SupportTicketSummary,
} from "./support-types";

const ticketInclude = {
  category: true,
  user: { include: { profile: true } },
  assignedTo: { include: { profile: true } },
} satisfies Prisma.SupportTicketInclude;

type TicketWithRelations = Prisma.SupportTicketGetPayload<{
  include: typeof ticketInclude;
}>;

function staffBadge(role: UserSystemRole | null | undefined): string | null {
  switch (role) {
    case "ADMIN":
      return "Admin";
    case "SUPPORT":
      return "Support";
    default:
      return null;
  }
}

function toSummary(ticket: TicketWithRelations): SupportTicketSummary {
  return {
    id: ticket.id,
    ticketNumber: ticket.ticketNumber,
    subject: ticket.subject,
    status: ticket.status,
    priority: ticket.priority,
    waitingOn: ticket.waitingOn,
    categoryName: ticket.category.name,
    categorySlug: ticket.category.slug,
    isOverdue: ticket.isOverdue,
    userUnreadCount: ticket.userUnreadCount,
    userHasReminder: ticket.userHasReminder,
    assignedToDisplayName: ticket.assignedTo
      ? getPublicUserName({ profile: ticket.assignedTo.profile })
      : null,
    lastActivityAt: ticket.updatedAt.toISOString(),
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
  };
}

async function recordEvent(
  ticketId: string,
  eventType: SupportTicketEventType,
  summary: string,
  actorUserId?: string | null,
  metadata?: Prisma.InputJsonValue,
): Promise<void> {
  await prisma.supportTicketEvent.create({
    data: {
      ticketId,
      eventType,
      summary,
      actorUserId: actorUserId ?? null,
      metadata,
    },
  });
}

async function loadMessages(ticketId: string): Promise<SupportMessageEntry[]> {
  const messages = await prisma.supportTicketMessage.findMany({
    where: { ticketId },
    include: {
      author: { include: { profile: true } },
      attachments: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return messages.map((message) => ({
    id: message.id,
    authorType: message.authorType,
    authorDisplayName: getPublicUserName({ profile: message.author.profile }),
    authorRoleBadge:
      message.authorType === "staff"
        ? staffBadge(message.author.systemRole)
        : null,
    body: message.body,
    isNewForUser: !message.isReadByUser && message.authorType === "staff",
    createdAt: message.createdAt.toISOString(),
    attachments: message.attachments.map(
      (attachment): SupportAttachmentEntry => ({
        id: attachment.id,
        fileName: attachment.fileName,
        mimeType: attachment.mimeType,
        sizeBytes: attachment.sizeBytes,
        createdAt: attachment.createdAt.toISOString(),
      }),
    ),
  }));
}

async function loadInternalNotes(
  ticketId: string,
): Promise<SupportInternalNoteEntry[]> {
  const notes = await prisma.supportTicketInternalNote.findMany({
    where: { ticketId },
    include: { author: { include: { profile: true } } },
    orderBy: { createdAt: "asc" },
  });

  return notes.map((note) => ({
    id: note.id,
    authorDisplayName: getPublicUserName({ profile: note.author.profile }),
    body: note.body,
    createdAt: note.createdAt.toISOString(),
  }));
}

async function loadEvents(ticketId: string): Promise<SupportEventEntry[]> {
  const events = await prisma.supportTicketEvent.findMany({
    where: { ticketId },
    include: { actor: { include: { profile: true } } },
    orderBy: { createdAt: "asc" },
  });

  return events.map((event) => ({
    id: event.id,
    eventType: event.eventType,
    summary: event.summary,
    actorDisplayName: event.actor
      ? getPublicUserName({ profile: event.actor.profile })
      : null,
    createdAt: event.createdAt.toISOString(),
  }));
}

async function findTicketByNumber(
  ticketNumber: string,
): Promise<TicketWithRelations | null> {
  return prisma.supportTicket.findUnique({
    where: { ticketNumber },
    include: ticketInclude,
  });
}

const DEFAULT_SUPPORT_CATEGORIES = [
  { name: "Meister-Support", slug: MEISTER_SUPPORT_CATEGORY_SLUG, description: "Exklusiver Support für Meisterclub-Mitglieder", sortOrder: 5, isMasterSupport: true },
  { name: "Kurse", slug: "kurse", description: "Fragen zu Kursen und Lektionen", sortOrder: 10, isMasterSupport: false },
  { name: "Zahlung", slug: "zahlung", description: "Rechnungen, Zahlungsprobleme", sortOrder: 20, isMasterSupport: false },
  { name: "Mitgliedschaft", slug: "mitgliedschaft", description: "Wurstclub, Meisterclub, Verlängerung", sortOrder: 30, isMasterSupport: false },
  { name: "Technik", slug: "technik", description: "Login, Seitenfehler, Browser", sortOrder: 40, isMasterSupport: false },
  { name: "Rezeptgenerator", slug: "rezeptgenerator", description: "Rezeptgenerator und Rezepte", sortOrder: 50, isMasterSupport: false },
  { name: "Forum/Community", slug: "forum-community", description: "Foren und Community", sortOrder: 60, isMasterSupport: false },
  { name: "Allgemeine Anfrage", slug: "allgemein", description: "Sonstige Anliegen", sortOrder: 70, isMasterSupport: false },
];

export async function ensureDefaultSupportCategories(): Promise<void> {
  for (const category of DEFAULT_SUPPORT_CATEGORIES) {
    await prisma.supportTicketCategory.upsert({
      where: { slug: category.slug },
      create: category,
      update: {
        name: category.name,
        description: category.description,
        sortOrder: category.sortOrder,
        isActive: true,
        isMasterSupport: category.isMasterSupport,
      },
    });
  }
}

export async function listSupportCategories(): Promise<SupportCategoryEntry[]> {
  await ensureDefaultSupportCategories();

  const categories = await prisma.supportTicketCategory.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    sortOrder: category.sortOrder,
    isActive: category.isActive,
    isMasterSupport: category.isMasterSupport,
  }));
}

export async function listSupportCategoriesForUser(
  userId?: string | null,
): Promise<SupportCategoryEntry[]> {
  const categories = await listSupportCategories();
  const role = await getUserMembershipRole(userId);

  if (hasMeisterclubAccess(role)) {
    return categories;
  }

  return categories.filter((category) => !category.isMasterSupport);
}

export async function listAllSupportCategoriesAdmin(): Promise<
  SupportCategoryEntry[]
> {
  const categories = await prisma.supportTicketCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    sortOrder: category.sortOrder,
    isActive: category.isActive,
    isMasterSupport: category.isMasterSupport,
  }));
}

export async function listSupportTemplates(): Promise<SupportTemplateEntry[]> {
  const templates = await prisma.supportReplyTemplate.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
  });

  return templates.map((template) => ({
    id: template.id,
    title: template.title,
    body: template.body,
    categoryId: template.categoryId,
    sortOrder: template.sortOrder,
    isActive: template.isActive,
  }));
}

export async function listSupportStaff(): Promise<SupportStaffEntry[]> {
  const staff = await prisma.user.findMany({
    where: {
      deletedAt: null,
      systemRole: { in: ["ADMIN", "SUPPORT"] },
    },
    include: { profile: true },
    orderBy: { email: "asc" },
  });

  return staff.map((user) => ({
    userId: user.id,
    displayName: getPublicUserName({ profile: user.profile }),
    email: user.email,
    systemRole: user.systemRole,
  }));
}

export async function getUserSupportInbox(
  userId: string,
): Promise<SupportInboxSummary> {
  const tickets = await prisma.supportTicket.findMany({
    where: { userId, anonymizedAt: null },
    include: ticketInclude,
    orderBy: { updatedAt: "desc" },
    take: 10,
  });

  const [unreadCount, openCount, reminderCount] = await Promise.all([
    prisma.supportTicket.count({
      where: { userId, userUnreadCount: { gt: 0 }, anonymizedAt: null },
    }),
    prisma.supportTicket.count({
      where: {
        userId,
        status: { in: ["open", "in_progress", "waiting_user"] },
        anonymizedAt: null,
      },
    }),
    prisma.supportTicket.count({
      where: { userId, userHasReminder: true, anonymizedAt: null },
    }),
  ]);

  return {
    unreadCount,
    openCount,
    reminderCount,
    recentTickets: tickets.map(toSummary),
  };
}

export async function countUnreadSupportTickets(userId: string): Promise<number> {
  return prisma.supportTicket.count({
    where: { userId, userUnreadCount: { gt: 0 }, anonymizedAt: null },
  });
}

export async function listUserSupportTickets(
  userId: string,
): Promise<SupportTicketSummary[]> {
  const tickets = await prisma.supportTicket.findMany({
    where: { userId, anonymizedAt: null },
    include: ticketInclude,
    orderBy: [{ userUnreadCount: "desc" }, { updatedAt: "desc" }],
  });

  return tickets.map(toSummary);
}

export async function createSupportTicket(
  userId: string,
  input: CreateSupportTicketInput,
): Promise<UserServiceResult<SupportTicketDetail>> {
  const subject = input.subject.trim();
  const message = input.message.trim();

  if (!subject || !message) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: "Betreff und Nachricht sind erforderlich.",
    });
  }

  const category = await prisma.supportTicketCategory.findFirst({
    where: { id: input.categoryId, isActive: true },
  });

  if (!category) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: "Bitte eine gültige Kategorie wählen.",
    });
  }

  if (category.isMasterSupport) {
    const role = await getUserMembershipRole(userId);

    if (!hasMeisterclubAccess(role)) {
      return userFailure({
        code: "FORBIDDEN",
        message: "Meister-Support ist nur für Meisterclub-Mitglieder verfügbar.",
      });
    }
  }

  const ticketNumber = await generateSupportTicketNumber();
  const priority = category.isMasterSupport ? "urgent" : input.priority;

  const ticket = await prisma.supportTicket.create({
    data: {
      ticketNumber,
      userId,
      categoryId: category.id,
      subject,
      priority,
      status: "open",
      waitingOn: "admin",
      lastUserReplyAt: new Date(),
      messages: {
        create: {
          authorUserId: userId,
          authorType: "user",
          body: message,
          isReadByUser: true,
        },
      },
    },
    include: ticketInclude,
  });

  await recordEvent(
    ticket.id,
    "created",
    `Ticket ${ticketNumber} erstellt.`,
    userId,
  );

  return getUserSupportTicketDetail(userId, ticketNumber);
}

export async function getUserSupportTicketDetail(
  userId: string,
  ticketNumber: string,
): Promise<UserServiceResult<SupportTicketDetail>> {
  const ticket = await findTicketByNumber(ticketNumber);

  if (!ticket || !canReadTicketAsUser(userId, ticket)) {
    return userFailure({
      code: "NOT_FOUND",
      message: "Ticket nicht gefunden.",
    });
  }

  // Nachrichten zuerst laden, damit isNewForUser noch stimmt — danach als gelesen markieren
  const messages = await loadMessages(ticket.id);

  if (ticket.userUnreadCount > 0 || ticket.userHasReminder) {
    await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: {
        userUnreadCount: 0,
        userHasReminder: false,
      },
    });

    await prisma.supportTicketMessage.updateMany({
      where: { ticketId: ticket.id, isReadByUser: false },
      data: { isReadByUser: true },
    });
  }

  return userSuccess({
    ...toSummary(ticket),
    userUnreadCount: 0,
    userHasReminder: false,
    categoryId: ticket.categoryId,
    userId: ticket.userId,
    userDisplayName: getPublicUserName({ profile: ticket.user.profile }),
    userEmail: ticket.user.email,
    assignedToUserId: ticket.assignedToUserId,
    resolvedAt: ticket.resolvedAt?.toISOString() ?? null,
    closedAt: ticket.closedAt?.toISOString() ?? null,
    rating: ticket.rating,
    ratingComment: ticket.ratingComment,
    closureNote: ticket.closureNote,
    canReply: canWriteTicketAsUser(ticket, userId),
    canMarkResolved: ["open", "in_progress", "waiting_user"].includes(
      ticket.status,
    ),
    canRate: ticket.status === "closed" && ticket.rating === null,
    messages,
  });
}

export async function addUserSupportReply(
  userId: string,
  ticketNumber: string,
  body: string,
): Promise<UserServiceResult<SupportTicketDetail>> {
  const ticket = await findTicketByNumber(ticketNumber);

  if (!ticket || !canWriteTicketAsUser(ticket, userId)) {
    return userFailure({
      code: "FORBIDDEN",
      message: "Antwort nicht möglich.",
    });
  }

  const trimmed = body.trim();

  if (!trimmed) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: "Nachricht darf nicht leer sein.",
    });
  }

  await prisma.supportTicketMessage.create({
    data: {
      ticketId: ticket.id,
      authorUserId: userId,
      authorType: "user",
      body: trimmed,
      isReadByUser: true,
    },
  });

  await prisma.supportTicket.update({
    where: { id: ticket.id },
    data: {
      status: ticket.status === "waiting_user" ? "in_progress" : ticket.status,
      waitingOn: "admin",
      lastUserReplyAt: new Date(),
      isOverdue: false,
      userHasReminder: false,
    },
  });

  await recordEvent(ticket.id, "user_reply", "Nutzer hat geantwortet.", userId);

  return getUserSupportTicketDetail(userId, ticketNumber);
}

export async function markUserTicketResolved(
  userId: string,
  ticketNumber: string,
): Promise<UserServiceResult<SupportTicketDetail>> {
  const ticket = await findTicketByNumber(ticketNumber);

  if (!ticket || !canReadTicketAsUser(userId, ticket)) {
    return userFailure({
      code: "NOT_FOUND",
      message: "Ticket nicht gefunden.",
    });
  }

  if (ticket.status === "closed") {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: "Ticket ist bereits geschlossen.",
    });
  }

  const now = new Date();

  await prisma.supportTicket.update({
    where: { id: ticket.id },
    data: {
      status: "resolved",
      waitingOn: "admin",
      resolvedAt: now,
      autoCloseAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  await recordEvent(
    ticket.id,
    "resolved",
    "Nutzer hat das Ticket als erledigt markiert.",
    userId,
  );

  return getUserSupportTicketDetail(userId, ticketNumber);
}

export async function rateSupportTicket(
  userId: string,
  ticketNumber: string,
  rating: number,
  ratingComment?: string | null,
): Promise<UserServiceResult<SupportTicketDetail>> {
  const ticket = await findTicketByNumber(ticketNumber);

  if (!ticket || !canReadTicketAsUser(userId, ticket)) {
    return userFailure({
      code: "NOT_FOUND",
      message: "Ticket nicht gefunden.",
    });
  }

  if (ticket.status !== "closed" && ticket.status !== "resolved") {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: "Bewertung erst nach Abschluss möglich.",
    });
  }

  if (rating < 1 || rating > 5) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: "Bewertung muss zwischen 1 und 5 liegen.",
    });
  }

  await prisma.supportTicket.update({
    where: { id: ticket.id },
    data: {
      rating,
      ratingComment: ratingComment?.trim() || null,
    },
  });

  await recordEvent(
    ticket.id,
    "rating",
    `Nutzerbewertung: ${rating}/5`,
    userId,
  );

  return getUserSupportTicketDetail(userId, ticketNumber);
}

export async function getSupportDashboardStats(
  role: UserSystemRole,
  staffUserId: string,
): Promise<SupportDashboardStats> {
  await processSupportEscalations();

  const baseWhere = canManageAllTickets(role)
    ? {}
    : { assignedToUserId: staffUserId };

  const [open, inProgress, waitingUser, overdue, closed, unassignedAlert, openMasterTickets, knowledgeDraftCount, unresolvedSearchCount] =
    await Promise.all([
      prisma.supportTicket.count({ where: { ...baseWhere, status: "open" } }),
      prisma.supportTicket.count({
        where: { ...baseWhere, status: "in_progress" },
      }),
      prisma.supportTicket.count({
        where: { ...baseWhere, status: "waiting_user" },
      }),
      prisma.supportTicket.count({
        where: { ...baseWhere, isOverdue: true, status: { not: "closed" } },
      }),
      prisma.supportTicket.count({ where: { ...baseWhere, status: "closed" } }),
      prisma.supportTicket.count({
        where: {
          assignedToUserId: null,
          status: { in: ["open", "in_progress"] },
          unassignedAlertSent: true,
        },
      }),
      prisma.supportTicket.count({
        where: {
          ...baseWhere,
          status: { in: ["open", "in_progress", "waiting_user"] },
          category: { isMasterSupport: true },
        },
      }),
      getKnowledgeBaseDraftCount(),
      prisma.knowledgeBaseSearchLog.count({ where: { hadResults: false } }),
    ]);

  return {
    open,
    inProgress,
    waitingUser,
    overdue,
    closed,
    unassignedAlert,
    openMasterTickets,
    knowledgeDraftCount,
    unresolvedSearchCount,
  };
}

export async function listAdminSupportTickets(
  role: UserSystemRole,
  staffUserId: string,
  filters: SupportTicketListFilters,
): Promise<SupportTicketSummary[]> {
  await processSupportEscalations();

  const where = buildSupportTicketWhere(filters, {
    staffUserId,
    onlyAssigned: !canManageAllTickets(role),
  });

  const tickets = await prisma.supportTicket.findMany({
    where,
    include: ticketInclude,
    orderBy: [
      { isOverdue: "desc" },
      { priority: "desc" },
      { updatedAt: "desc" },
    ],
  });

  return tickets
    .filter((ticket) => canReadTicketAsStaff(role, staffUserId, ticket))
    .map(toSummary);
}

export async function getAdminSupportTicketDetail(
  role: UserSystemRole,
  staffUserId: string,
  ticketNumber: string,
): Promise<UserServiceResult<SupportTicketDetail>> {
  const ticket = await findTicketByNumber(ticketNumber);

  if (!ticket || !canReadTicketAsStaff(role, staffUserId, ticket)) {
    return userFailure({
      code: "NOT_FOUND",
      message: "Ticket nicht gefunden.",
    });
  }

  const [messages, internalNotes, events] = await Promise.all([
    loadMessages(ticket.id),
    loadInternalNotes(ticket.id),
    loadEvents(ticket.id),
  ]);

  return userSuccess({
    ...toSummary(ticket),
    categoryId: ticket.categoryId,
    userId: ticket.userId,
    userDisplayName: getPublicUserName({ profile: ticket.user.profile }),
    userEmail: ticket.user.email,
    assignedToUserId: ticket.assignedToUserId,
    resolvedAt: ticket.resolvedAt?.toISOString() ?? null,
    closedAt: ticket.closedAt?.toISOString() ?? null,
    rating: ticket.rating,
    ratingComment: ticket.ratingComment,
    closureNote: ticket.closureNote,
    canReply: canWriteTicketAsStaff(role, staffUserId, ticket),
    canMarkResolved: false,
    canRate: false,
    messages,
    internalNotes,
    events,
  });
}

export async function addStaffSupportReply(
  role: UserSystemRole,
  staffUserId: string,
  ticketNumber: string,
  body: string,
  options: { setWaitingUser?: boolean } = {},
): Promise<UserServiceResult<SupportTicketDetail>> {
  const ticket = await findTicketByNumber(ticketNumber);

  if (!ticket || !canWriteTicketAsStaff(role, staffUserId, ticket)) {
    return userFailure({
      code: "FORBIDDEN",
      message: "Antwort nicht möglich.",
    });
  }

  const trimmed = body.trim();

  if (!trimmed) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: "Nachricht darf nicht leer sein.",
    });
  }

  await prisma.supportTicketMessage.create({
    data: {
      ticketId: ticket.id,
      authorUserId: staffUserId,
      authorType: "staff",
      body: trimmed,
      isReadByUser: false,
    },
  });

  const now = new Date();
  const waitingUser = options.setWaitingUser ?? false;

  await prisma.supportTicket.update({
    where: { id: ticket.id },
    data: {
      status: waitingUser ? "waiting_user" : "in_progress",
      waitingOn: waitingUser ? "user" : "admin",
      lastStaffReplyAt: now,
      isOverdue: false,
      userUnreadCount: { increment: 1 },
      userHasReminder: false,
    },
  });

  await recordEvent(
    ticket.id,
    "public_reply",
    "Support hat geantwortet.",
    staffUserId,
  );

  const { createUserAccountMessage } = await import(
    "@/lib/account/account-message-service"
  );

  await createUserAccountMessage({
    userId: ticket.userId,
    messageType: "ticket_reply",
    title: `Neue Antwort zu Ticket ${ticket.ticketNumber}`,
    body: `Der Support hat auf „${ticket.subject}" geantwortet.`,
    linkUrl: `/mein-bereich/support/${ticket.ticketNumber}`,
  });

  const ticketUser = await prisma.user.findUnique({
    where: { id: ticket.userId },
    select: { email: true, profile: { select: { firstName: true } } },
  });

  if (ticketUser?.email) {
    const { sendPlatformEmail } = await import("@/lib/email/email-service");
    const { ensureEmailSystemDefaults } = await import("@/lib/email/email-bootstrap");

    await ensureEmailSystemDefaults();

    void sendPlatformEmail({
      category: "TICKET",
      recipientEmail: ticketUser.email,
      recipientUserId: ticket.userId,
      templateKey: "ticket.reply",
      variables: {
        firstName: ticketUser.profile?.firstName ?? "",
        ticketNumber: ticket.ticketNumber,
        bodyHtml: trimmed.slice(0, 500),
        supportUrl: buildAppUrl(`/mein-bereich/support/${ticket.ticketNumber}`),
      },
      priority: "HIGH",
      relatedEntity: { type: "support_ticket", id: ticket.id },
      requestedByUserId: staffUserId,
    }).catch(console.error);
  }

  return getAdminSupportTicketDetail(role, staffUserId, ticketNumber);
}

export async function addInternalSupportNote(
  role: UserSystemRole,
  staffUserId: string,
  ticketNumber: string,
  body: string,
): Promise<UserServiceResult<SupportTicketDetail>> {
  const ticket = await findTicketByNumber(ticketNumber);

  if (!ticket || !canReadTicketAsStaff(role, staffUserId, ticket)) {
    return userFailure({
      code: "FORBIDDEN",
      message: "Interne Notiz nicht möglich.",
    });
  }

  const trimmed = body.trim();

  if (!trimmed) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: "Notiz darf nicht leer sein.",
    });
  }

  await prisma.supportTicketInternalNote.create({
    data: {
      ticketId: ticket.id,
      authorUserId: staffUserId,
      body: trimmed,
    },
  });

  await recordEvent(
    ticket.id,
    "internal_note",
    "Interne Notiz hinzugefügt.",
    staffUserId,
  );

  return getAdminSupportTicketDetail(role, staffUserId, ticketNumber);
}

export async function updateSupportTicketAdmin(
  role: UserSystemRole,
  staffUserId: string,
  ticketNumber: string,
  input: {
    status?: SupportTicketStatus;
    priority?: SupportTicketPriority;
    categoryId?: string;
    closureNote?: string | null;
  },
): Promise<UserServiceResult<SupportTicketDetail>> {
  const ticket = await findTicketByNumber(ticketNumber);

  if (!ticket || !canReadTicketAsStaff(role, staffUserId, ticket)) {
    return userFailure({
      code: "NOT_FOUND",
      message: "Ticket nicht gefunden.",
    });
  }

  const data: Prisma.SupportTicketUpdateInput = {};
  const now = new Date();

  if (input.status) {
    data.status = input.status;

    if (input.status === "resolved") {
      data.resolvedAt = now;
      data.autoCloseAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      data.waitingOn = "admin";
    }

    if (input.status === "closed") {
      data.closedAt = now;
      data.waitingOn = "admin";
    }

    if (input.status === "waiting_user") {
      data.waitingOn = "user";
    }

    if (input.status === "in_progress" || input.status === "open") {
      data.waitingOn = "admin";
    }
  }

  if (input.priority) {
    data.priority = input.priority;
  }

  if (input.categoryId) {
    data.category = { connect: { id: input.categoryId } };
  }

  if (input.closureNote !== undefined) {
    data.closureNote = input.closureNote?.trim() || null;
  }

  await prisma.supportTicket.update({
    where: { id: ticket.id },
    data,
  });

  if (input.status) {
    await recordEvent(
      ticket.id,
      "status_changed",
      `Status geändert zu „${input.status}“.`,
      staffUserId,
      { status: input.status },
    );
  }

  return getAdminSupportTicketDetail(role, staffUserId, ticketNumber);
}

export async function assignSupportTicket(
  role: UserSystemRole,
  staffUserId: string,
  ticketNumber: string,
  assigneeUserId: string,
  internalComment?: string | null,
): Promise<UserServiceResult<SupportTicketDetail>> {
  const ticket = await findTicketByNumber(ticketNumber);

  if (!ticket || !canReadTicketAsStaff(role, staffUserId, ticket)) {
    return userFailure({
      code: "NOT_FOUND",
      message: "Ticket nicht gefunden.",
    });
  }

  const assignee = await prisma.user.findUnique({
    where: { id: assigneeUserId },
    include: { profile: true },
  });

  if (!assignee || !isSupportStaffRole(assignee.systemRole)) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: "Ungültiger Bearbeiter.",
    });
  }

  const isReassign = Boolean(ticket.assignedToUserId);

  await prisma.supportTicket.update({
    where: { id: ticket.id },
    data: {
      assignedToUserId: assigneeUserId,
      status: ticket.status === "open" ? "in_progress" : ticket.status,
      waitingOn: "admin",
    },
  });

  await recordEvent(
    ticket.id,
    isReassign ? "reassigned" : "assigned",
    `Ticket ${isReassign ? "weitergereicht an" : "zugewiesen an"} ${getPublicUserName({ profile: assignee.profile })}.`,
    staffUserId,
    { assigneeUserId },
  );

  if (internalComment?.trim()) {
    await prisma.supportTicketInternalNote.create({
      data: {
        ticketId: ticket.id,
        authorUserId: staffUserId,
        body: internalComment.trim(),
      },
    });
  }

  return getAdminSupportTicketDetail(role, staffUserId, ticketNumber);
}

export async function anonymizeSupportTicket(
  staffUserId: string,
  ticketNumber: string,
): Promise<UserServiceResult<true>> {
  const ticket = await findTicketByNumber(ticketNumber);

  if (!ticket) {
    return userFailure({
      code: "NOT_FOUND",
      message: "Ticket nicht gefunden.",
    });
  }

  await prisma.supportTicket.update({
    where: { id: ticket.id },
    data: {
      anonymizedAt: new Date(),
      subject: "Anonymisiertes Ticket",
      closureNote: null,
      ratingComment: null,
    },
  });

  await prisma.supportTicketMessage.updateMany({
    where: { ticketId: ticket.id },
    data: { body: "[Inhalt anonymisiert]" },
  });

  await recordEvent(
    ticket.id,
    "anonymized",
    "Ticket-Daten anonymisiert (DSGVO).",
    staffUserId,
  );

  return userSuccess(true);
}

export async function exportSupportTicketsCsv(
  role: UserSystemRole,
  staffUserId: string,
  filters: SupportTicketListFilters,
): Promise<string> {
  const tickets = await listAdminSupportTickets(role, staffUserId, filters);

  const header =
    "Ticketnummer;Betreff;Status;Priorität;Kategorie;Bearbeiter;Erstellt;Überfällig";

  const rows = tickets.map((ticket) =>
    [
      ticket.ticketNumber,
      ticket.subject.replace(/;/g, ","),
      ticket.status,
      ticket.priority,
      ticket.categoryName,
      ticket.assignedToDisplayName ?? "",
      ticket.createdAt,
      ticket.isOverdue ? "ja" : "nein",
    ].join(";"),
  );

  return [header, ...rows].join("\n");
}

export async function getTicketForAttachmentAccess(
  attachmentId: string,
): Promise<
  | {
      ticket: SupportTicket;
      attachment: {
        id: string;
        storageKey: string;
        fileName: string;
        mimeType: string;
      };
    }
  | null
> {
  const attachment = await prisma.supportTicketAttachment.findUnique({
    where: { id: attachmentId },
    include: { ticket: true },
  });

  if (!attachment) {
    return null;
  }

  return {
    ticket: attachment.ticket,
    attachment: {
      id: attachment.id,
      storageKey: attachment.storageKey,
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
    },
  };
}

export async function createSupportAttachmentRecord(input: {
  ticketId: string;
  messageId?: string | null;
  uploadedByUserId: string;
  storageKey: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}): Promise<SupportAttachmentEntry> {
  const attachment = await prisma.supportTicketAttachment.create({
    data: {
      ticketId: input.ticketId,
      messageId: input.messageId ?? null,
      uploadedByUserId: input.uploadedByUserId,
      storageKey: input.storageKey,
      fileName: input.fileName,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
    },
  });

  await recordEvent(
    input.ticketId,
    "attachment_added",
    `Anhang „${input.fileName}“ hochgeladen.`,
    input.uploadedByUserId,
  );

  return {
    id: attachment.id,
    fileName: attachment.fileName,
    mimeType: attachment.mimeType,
    sizeBytes: attachment.sizeBytes,
    createdAt: attachment.createdAt.toISOString(),
  };
}

export async function upsertSupportCategory(
  input: Partial<SupportCategoryEntry> & { name: string; slug: string },
): Promise<SupportCategoryEntry> {
  const category = input.id
    ? await prisma.supportTicketCategory.update({
        where: { id: input.id },
        data: {
          name: input.name.trim(),
          slug: input.slug.trim(),
          description: input.description?.trim() || null,
          sortOrder: input.sortOrder ?? 0,
          isActive: input.isActive ?? true,
        },
      })
    : await prisma.supportTicketCategory.create({
        data: {
          name: input.name.trim(),
          slug: input.slug.trim(),
          description: input.description?.trim() || null,
          sortOrder: input.sortOrder ?? 100,
          isActive: input.isActive ?? true,
        },
      });

  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    sortOrder: category.sortOrder,
    isActive: category.isActive,
    isMasterSupport: category.isMasterSupport,
  };
}

export async function upsertSupportTemplate(
  input: Partial<SupportTemplateEntry> & { title: string; body: string },
): Promise<SupportTemplateEntry> {
  const template = input.id
    ? await prisma.supportReplyTemplate.update({
        where: { id: input.id },
        data: {
          title: input.title.trim(),
          body: input.body.trim(),
          categoryId: input.categoryId ?? null,
          sortOrder: input.sortOrder ?? 0,
          isActive: input.isActive ?? true,
        },
      })
    : await prisma.supportReplyTemplate.create({
        data: {
          title: input.title.trim(),
          body: input.body.trim(),
          categoryId: input.categoryId ?? null,
          sortOrder: input.sortOrder ?? 100,
          isActive: input.isActive ?? true,
        },
      });

  return {
    id: template.id,
    title: template.title,
    body: template.body,
    categoryId: template.categoryId,
    sortOrder: template.sortOrder,
    isActive: template.isActive,
  };
}
