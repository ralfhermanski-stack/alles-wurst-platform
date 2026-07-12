/**
 * @file membership-labels.ts
 * @purpose Deutsche Bezeichnungen für DB-Mitgliedschaftsstatus und Zahlung.
 */

import type { MembershipStatus, PaymentStatus } from "@prisma/client";

export const MEMBERSHIP_STATUS_LABELS: Record<MembershipStatus, string> = {
  none: "Keine Mitgliedschaft",
  active: "Aktiv",
  paused: "Pausiert",
  cancelled: "Beendet",
  expired: "Abgelaufen",
  blocked: "Gesperrt",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  none: "Keine Zahlung",
  pending: "Ausstehend",
  paid: "Bezahlt",
  failed: "Fehlgeschlagen",
  overdue: "Überfällig",
  refunded: "Erstattet",
};

export const MEMBERSHIP_STATUS_DESCRIPTIONS: Record<MembershipStatus, string> = {
  none: "Registriert ohne bezahlte Club-Stufe.",
  active: "Mitgliedschaft ist aktiv und gültig.",
  paused: "Vorübergehend pausiert — z. B. manuell durch Buchhaltung.",
  cancelled: "Mitgliedschaft wurde beendet.",
  expired: "Laufzeit abgelaufen — Verlängerung oder Upgrade nötig.",
  blocked: "Zugriff gesperrt — Support oder Buchhaltung kontaktieren.",
};

export const PAYMENT_STATUS_DESCRIPTIONS: Record<PaymentStatus, string> = {
  none: "Noch keine Zahlung erforderig.",
  pending: "Zahlung wurde ausgelöst, Bestätigung steht aus.",
  paid: "Zahlung erfolgreich verbucht.",
  failed: "Zahlung fehlgeschlagen — manuelle Prüfung möglich.",
  overdue: "Zahlung überfällig.",
  refunded: "Betrag wurde erstattet.",
};
