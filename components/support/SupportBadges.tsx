import type { SupportTicketPriority, SupportTicketStatus } from "@prisma/client";

import {
  SUPPORT_PRIORITY_LABELS,
  SUPPORT_STATUS_LABELS,
  supportPriorityBadgeClass,
  supportStatusBadgeClass,
} from "@/lib/support/support-labels";

export function SupportStatusBadge({
  status,
}: {
  status: SupportTicketStatus;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${supportStatusBadgeClass(status)}`}
    >
      {SUPPORT_STATUS_LABELS[status]}
    </span>
  );
}

export function SupportPriorityBadge({
  priority,
}: {
  priority: SupportTicketPriority;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${supportPriorityBadgeClass(priority)}`}
    >
      {SUPPORT_PRIORITY_LABELS[priority]}
    </span>
  );
}
