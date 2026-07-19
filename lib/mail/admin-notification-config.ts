/**
 * @file admin-notification-config.ts
 * @purpose Zentrale Empfängeradresse für Staff-/Admin-Benachrichtigungen.
 */

const DEFAULT_ADMIN_NOTIFICATION_EMAIL = "admin@alles-wurst.de";

/**
 * Zieladresse für interne Benachrichtigungen (neue Tickets, Staff-Alerts, …).
 * Nutzerbezogene Transaktionsmails (Verify, Reset, Beta-Invite, …) nutzen dies nicht.
 */
export function getAdminNotificationEmail(): string {
  const configured =
    process.env.ADMIN_EMAIL?.trim() ||
    process.env.SUPPORT_NOTIFY_EMAIL?.trim() ||
    process.env.SUPPORT_NOTIFY?.trim();

  if (configured && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(configured)) {
    return configured.toLowerCase();
  }

  return DEFAULT_ADMIN_NOTIFICATION_EMAIL;
}

export const DEFAULT_ADMIN_EMAIL = DEFAULT_ADMIN_NOTIFICATION_EMAIL;
