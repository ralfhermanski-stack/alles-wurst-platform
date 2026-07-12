/**
 * @file support-escalation-service.ts
 * @purpose Automatismen: Eskalation, Erinnerungen, Auto-Schließen.
 */

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export async function processSupportEscalations(): Promise<{
  unassignedAlerts: number;
  overdueMarked: number;
  userReminders: number;
  autoClosed: number;
}> {
  const now = new Date();
  let unassignedAlerts = 0;
  let overdueMarked = 0;
  let userReminders = 0;
  let autoClosed = 0;

  const openWithoutAssignee = await prisma.supportTicket.findMany({
    where: {
      status: { in: ["open", "in_progress"] },
      assignedToUserId: null,
      unassignedAlertSent: false,
      createdAt: { lte: new Date(now.getTime() - 24 * HOUR_MS) },
    },
    select: { id: true, ticketNumber: true },
  });

  for (const ticket of openWithoutAssignee) {
    await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: { unassignedAlertSent: true },
    });

    await prisma.supportTicketEvent.create({
      data: {
        ticketId: ticket.id,
        eventType: "escalated",
        summary: `Ticket ${ticket.ticketNumber} seit über 24 Stunden ohne Bearbeiter.`,
        metadata: { reason: "unassigned_24h" },
      },
    });

    unassignedAlerts += 1;
  }

  const staleTickets = await prisma.supportTicket.findMany({
    where: {
      status: { in: ["open", "in_progress", "waiting_user"] },
      isOverdue: false,
      OR: [
        {
          waitingOn: "admin",
          updatedAt: { lte: new Date(now.getTime() - 48 * HOUR_MS) },
        },
        {
          waitingOn: "admin",
          lastStaffReplyAt: null,
          createdAt: { lte: new Date(now.getTime() - 48 * HOUR_MS) },
        },
      ],
    },
    select: { id: true, ticketNumber: true },
  });

  for (const ticket of staleTickets) {
    await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: { isOverdue: true },
    });

    await prisma.supportTicketEvent.create({
      data: {
        ticketId: ticket.id,
        eventType: "escalated",
        summary: `Ticket ${ticket.ticketNumber} als überfällig markiert (48h ohne Antwort).`,
        metadata: { reason: "no_reply_48h" },
      },
    });

    overdueMarked += 1;
  }

  const waitingUserTickets = await prisma.supportTicket.findMany({
    where: {
      status: "waiting_user",
      userHasReminder: false,
      updatedAt: { lte: new Date(now.getTime() - 7 * DAY_MS) },
    },
    select: { id: true },
  });

  for (const ticket of waitingUserTickets) {
    await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: {
        userHasReminder: true,
        userReminderAt: now,
        userUnreadCount: { increment: 1 },
      },
    });

    await prisma.supportTicketEvent.create({
      data: {
        ticketId: ticket.id,
        eventType: "reminder_sent",
        summary: "Erinnerung an den Nutzer: Rückfrage seit 7 Tagen offen.",
      },
    });

    userReminders += 1;
  }

  const resolvedTickets = await prisma.supportTicket.findMany({
    where: {
      status: "resolved",
      resolvedAt: { lte: new Date(now.getTime() - 7 * DAY_MS) },
    },
    select: { id: true, ticketNumber: true },
  });

  for (const ticket of resolvedTickets) {
    await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: {
        status: "closed",
        closedAt: now,
        waitingOn: "admin",
      },
    });

    await prisma.supportTicketEvent.create({
      data: {
        ticketId: ticket.id,
        eventType: "closed",
        summary: `Ticket ${ticket.ticketNumber} nach 7 Tagen automatisch geschlossen.`,
        metadata: { reason: "auto_close_resolved" },
      },
    });

    autoClosed += 1;
  }

  return { unassignedAlerts, overdueMarked, userReminders, autoClosed };
}

export function buildSupportTicketWhere(
  filters: {
    status?: string;
    priority?: string;
    categoryId?: string;
    categorySlug?: string;
    assigneeId?: string;
    query?: string;
    fromDate?: string;
    toDate?: string;
    overdue?: boolean;
  },
  options: { staffUserId?: string; onlyAssigned?: boolean } = {},
): Prisma.SupportTicketWhereInput {
  const where: Prisma.SupportTicketWhereInput = {};

  if (filters.status === "active") {
    where.status = { in: ["open", "in_progress", "waiting_user"] };
  } else if (filters.status && filters.status !== "all") {
    where.status = filters.status as Prisma.EnumSupportTicketStatusFilter;
  }

  if (filters.overdue) {
    where.isOverdue = true;

    if (!filters.status || filters.status === "all") {
      where.status = { not: "closed" };
    }
  }

  if (filters.priority && filters.priority !== "all") {
    where.priority = filters.priority as Prisma.EnumSupportTicketPriorityFilter;
  }

  if (filters.categorySlug) {
    where.category = { slug: filters.categorySlug };
  } else if (filters.categoryId) {
    where.categoryId = filters.categoryId;
  }

  if (filters.assigneeId === "unassigned") {
    where.assignedToUserId = null;
  } else if (filters.assigneeId === "mine" && options.staffUserId) {
    where.assignedToUserId = options.staffUserId;
  } else if (filters.assigneeId && filters.assigneeId !== "all") {
    where.assignedToUserId = filters.assigneeId;
  } else if (options.onlyAssigned && options.staffUserId) {
    where.assignedToUserId = options.staffUserId;
  }

  if (filters.query?.trim()) {
    const q = filters.query.trim();

    where.OR = [
      { ticketNumber: { contains: q, mode: "insensitive" } },
      { subject: { contains: q, mode: "insensitive" } },
      { user: { email: { contains: q, mode: "insensitive" } } },
      {
        user: {
          profile: {
            OR: [
              { publicName: { contains: q, mode: "insensitive" } },
              { firstName: { contains: q, mode: "insensitive" } },
              { lastName: { contains: q, mode: "insensitive" } },
            ],
          },
        },
      },
    ];
  }

  if (filters.fromDate || filters.toDate) {
    where.createdAt = {};

    if (filters.fromDate) {
      where.createdAt.gte = new Date(filters.fromDate);
    }

    if (filters.toDate) {
      where.createdAt.lte = new Date(filters.toDate);
    }
  }

  return where;
}
