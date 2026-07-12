/**
 * @file email-categories.ts
 */

import type { EmailCategory } from "@prisma/client";

export const EMAIL_CATEGORIES: EmailCategory[] = [
  "AUTH",
  "ACCOUNT",
  "SUPPORT",
  "TICKET",
  "COURSE",
  "CERTIFICATE",
  "ORDER",
  "PAYMENT",
  "BILLING",
  "MEMBERSHIP",
  "WITHDRAWAL",
  "PRIVACY",
  "CHALLENGE",
  "COMMUNITY",
  "MASTER_SUPPORT",
  "NEWSLETTER",
  "SECURITY",
  "SYSTEM",
  "ADMIN_MANUAL",
];

export const EMAIL_CATEGORY_LABELS: Record<EmailCategory, string> = {
  AUTH: "Authentifizierung",
  ACCOUNT: "Konto",
  SUPPORT: "Support",
  TICKET: "Tickets",
  COURSE: "Kurse",
  CERTIFICATE: "Zertifikate",
  ORDER: "Bestellungen",
  PAYMENT: "Zahlungen",
  BILLING: "Buchhaltung",
  MEMBERSHIP: "Mitgliedschaft",
  WITHDRAWAL: "Widerruf",
  PRIVACY: "Datenschutz",
  CHALLENGE: "Challenges",
  COMMUNITY: "Community",
  MASTER_SUPPORT: "Meister-Support",
  NEWSLETTER: "Newsletter",
  SECURITY: "Sicherheit",
  SYSTEM: "System",
  ADMIN_MANUAL: "Manueller Versand",
};

export const PROVIDER_TYPE_OPTIONS = [
  { value: "DEV", label: "Entwicklung (nur Log)" },
  { value: "DISABLED", label: "Deaktiviert" },
  { value: "SMTP", label: "SMTP" },
  { value: "RESEND", label: "Resend" },
  { value: "BREVO", label: "Brevo" },
] as const;
