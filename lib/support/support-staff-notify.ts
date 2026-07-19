/**
 * @file support-staff-notify.ts
 * @purpose Staff-Benachrichtigungen bei Ticket-Ereignissen.
 */

import { getAdminNotificationEmail } from "@/lib/mail/admin-notification-config";
import { buildAppUrl } from "@/lib/mail/mail-service";

export type SupportStaffNotifyKind = "created" | "user_reply";

export async function notifyStaffOfSupportTicketEvent(input: {
  kind: SupportStaffNotifyKind;
  ticketId: string;
  ticketNumber: string;
  subject: string;
  priority: string;
  categoryName?: string | null;
  userEmail: string;
  userDisplayName: string;
  messagePreview: string;
}): Promise<void> {
  const adminEmail = getAdminNotificationEmail();
  const adminUrl = buildAppUrl(`/admin/support/${input.ticketNumber}`);
  const preview = input.messagePreview.trim().slice(0, 500);

  const { ensureEmailSystemDefaults } = await import(
    "@/lib/email/email-bootstrap"
  );
  const { sendPlatformEmail } = await import("@/lib/email/email-service");

  await ensureEmailSystemDefaults();

  const templateKey =
    input.kind === "created" ? "ticket.staff.created" : "ticket.staff.reply";

  await sendPlatformEmail({
    category: "TICKET",
    recipientEmail: adminEmail,
    templateKey,
    variables: {
      ticketNumber: input.ticketNumber,
      subject: input.subject,
      priority: input.priority,
      categoryName: input.categoryName ?? "",
      userEmail: input.userEmail,
      userDisplayName: input.userDisplayName,
      bodyHtml: preview,
      adminUrl,
    },
    priority: "HIGH",
    relatedEntity: { type: "support_ticket", id: input.ticketId },
  });
}
