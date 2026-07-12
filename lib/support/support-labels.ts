/**
 * @file support-labels.ts
 * @purpose Deutsche Bezeichnungen für Support-Tickets.
 */

import type {
  SupportTicketPriority,
  SupportTicketStatus,
  SupportTicketWaitingOn,
} from "@prisma/client";

export const SUPPORT_STATUS_LABELS: Record<SupportTicketStatus, string> = {
  open: "Offen",
  in_progress: "In Bearbeitung",
  waiting_user: "Rückfrage an User",
  resolved: "Gelöst",
  closed: "Geschlossen",
};

export const SUPPORT_PRIORITY_LABELS: Record<SupportTicketPriority, string> = {
  normal: "Normal",
  important: "Wichtig",
  urgent: "Dringend",
};

export const SUPPORT_WAITING_ON_LABELS: Record<SupportTicketWaitingOn, string> = {
  admin: "Wartet auf Admin",
  user: "Wartet auf User",
};

export function supportStatusBadgeClass(status: SupportTicketStatus): string {
  switch (status) {
    case "open":
      return "bg-sky-500/15 text-sky-300";
    case "in_progress":
      return "bg-aw-gold/15 text-aw-gold";
    case "waiting_user":
      return "bg-violet-500/15 text-violet-300";
    case "resolved":
      return "bg-emerald-500/15 text-emerald-300";
    case "closed":
      return "bg-aw-muted/20 text-aw-muted";
    default:
      return "bg-aw-muted/20 text-aw-muted";
  }
}

export function supportPriorityBadgeClass(
  priority: SupportTicketPriority,
): string {
  switch (priority) {
    case "urgent":
      return "bg-red-500/20 text-red-300 ring-1 ring-red-500/30";
    case "important":
      return "bg-amber-500/15 text-amber-300";
    default:
      return "bg-aw-surface text-aw-muted";
  }
}
