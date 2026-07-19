/**
 * @file support-types.ts
 * @purpose Typen für das Support-Ticketsystem.
 */

import type {
  SupportTicketEventType,
  SupportTicketMessageAuthorType,
  SupportTicketPriority,
  SupportTicketStatus,
  SupportTicketWaitingOn,
} from "@prisma/client";

export type SupportAttachmentEntry = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
};

export type SupportMessageEntry = {
  id: string;
  authorType: SupportTicketMessageAuthorType;
  authorDisplayName: string;
  authorRoleBadge: string | null;
  body: string;
  isNewForUser: boolean;
  createdAt: string;
  attachments: SupportAttachmentEntry[];
};

export type SupportInternalNoteEntry = {
  id: string;
  authorDisplayName: string;
  body: string;
  createdAt: string;
};

export type SupportEventEntry = {
  id: string;
  eventType: SupportTicketEventType;
  summary: string;
  actorDisplayName: string | null;
  createdAt: string;
};

export type SupportTicketSummary = {
  id: string;
  ticketNumber: string;
  subject: string;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  waitingOn: SupportTicketWaitingOn;
  categoryName: string;
  categorySlug: string;
  isOverdue: boolean;
  userUnreadCount: number;
  userHasReminder: boolean;
  assignedToDisplayName: string | null;
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
};

export type SupportTicketDetail = SupportTicketSummary & {
  categoryId: string;
  userId: string;
  userDisplayName: string;
  userEmail: string;
  assignedToUserId: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  rating: number | null;
  ratingComment: string | null;
  closureNote: string | null;
  canReply: boolean;
  canMarkResolved: boolean;
  canRate: boolean;
  messages: SupportMessageEntry[];
  internalNotes?: SupportInternalNoteEntry[];
  events?: SupportEventEntry[];
};

export type SupportInboxSummary = {
  unreadCount: number;
  openCount: number;
  reminderCount: number;
  recentTickets: SupportTicketSummary[];
};

export type SupportCategoryEntry = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  isMasterSupport: boolean;
};

export type SupportTemplateEntry = {
  id: string;
  title: string;
  body: string;
  categoryId: string | null;
  sortOrder: number;
  isActive: boolean;
};

export type SupportDashboardStats = {
  open: number;
  inProgress: number;
  waitingUser: number;
  overdue: number;
  closed: number;
  unassignedAlert: number;
  openMasterTickets: number;
  knowledgeDraftCount: number;
  unresolvedSearchCount: number;
};

export type SupportStaffEntry = {
  userId: string;
  displayName: string;
  email: string;
  systemRole: string;
};

export type CreateSupportTicketInput = {
  subject: string;
  categoryId: string;
  priority: SupportTicketPriority;
  message: string;
};

export type SupportTicketListFilters = {
  status?: SupportTicketStatus | "all" | "active";
  priority?: SupportTicketPriority | "all";
  categoryId?: string;
  categorySlug?: string;
  assigneeId?: string | "unassigned" | "mine";
  query?: string;
  fromDate?: string;
  toDate?: string;
  overdue?: boolean;
};

export function parseSupportTicketListFilters(
  searchParams: URLSearchParams,
): SupportTicketListFilters {
  const overdueParam = searchParams.get("overdue");

  return {
    status: (searchParams.get("status") ?? "all") as SupportTicketListFilters["status"],
    priority: (searchParams.get("priority") ?? "all") as SupportTicketListFilters["priority"],
    categoryId: searchParams.get("categoryId") ?? undefined,
    categorySlug: searchParams.get("category") ?? undefined,
    assigneeId: searchParams.get("assigneeId") ?? undefined,
    query: searchParams.get("query") ?? undefined,
    fromDate: searchParams.get("fromDate") ?? undefined,
    toDate: searchParams.get("toDate") ?? undefined,
    overdue: overdueParam === "1" || overdueParam === "true",
  };
}
