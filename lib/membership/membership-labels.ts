/**
 * @file membership-labels.ts
 * @purpose Deutsche Bezeichnungen für Mitgliedschaftsrollen.
 */

import type { MembershipRole } from "./membership-rules";

export const MEMBERSHIP_ROLE_LABELS: Record<MembershipRole, string> = {
  guest: "Gast",
  registered: "Registriert (Basis)",
  wurstclub: "Wurst Club",
  meisterclub: "Meisterclub",
  accounting: "Buchhaltung",
  admin: "Administrator",
};

export const MEMBERSHIP_ROLE_DESCRIPTIONS: Record<MembershipRole, string> = {
  guest: "Keine eigenen Rezepte — nur öffentliche Inhalte.",
  registered: "Bis zu 3 eigene Rezepte und Zugriff auf die Rezeptdatenbank.",
  wurstclub: "Unbegrenzt eigene Rezepte und voller Club-Zugriff.",
  meisterclub: "Wie Wurst Club — Meisteranalyse folgt später.",
  accounting:
    "Manuelle Korrektur von Zahlungen und Mitgliedschaften — keine Rezept-Administration.",
  admin: "Voller Zugriff ohne Limits (Prototyp-Token).",
};
