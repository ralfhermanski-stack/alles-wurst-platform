/**
 * @file mail-service.ts
 * @purpose Mail-Versand — delegiert an das zentrale E-Mail-System.
 */

import { sendLegacyMailMessage } from "@/lib/email/email-service";

import type { MailMessage, MailSendResult } from "./mail-types";

/**
 * Sendet eine E-Mail über den zentralen Plattform-E-Mail-Service.
 */
export async function sendMail(message: MailMessage): Promise<MailSendResult> {
  const result = await sendLegacyMailMessage({
    to: message.to,
    subject: message.subject,
    text: message.text,
    html: message.html,
    actionLink: message.actionLink,
    priority: "HIGH",
  });

  return {
    sent: result.sent,
    devActionLink: result.devActionLink,
  };
}

/**
 * Baut eine absolute URL für Aktionslinks (Verifikation, Passwort-Reset).
 */
export function buildAppUrl(path: string): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.APP_URL?.trim() ||
    "http://localhost:3000";

  const normalizedBase = base.replace(/\/+$/g, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${normalizedBase}${normalizedPath}`;
}

export {
  buildEmailVerificationMail,
  buildPasswordResetMail,
} from "./build-system-mails";
