/**
 * @file platform-text-types.ts
 */

import type { PlatformTextFormat } from "@prisma/client";

export type PlatformTextCategory =
  | "headings"
  | "text"
  | "buttons"
  | "menu"
  | "footer"
  | "dashboard"
  | "courses"
  | "member"
  | "forum"
  | "tickets"
  | "blog"
  | "forms"
  | "errors"
  | "success"
  | "auth"
  | "checkout"
  | "emails"
  | "legal"
  | "account"
  | "privacy"
  | "admin";

export type PlatformTextDefault = {
  key: string;
  category: PlatformTextCategory;
  label: string;
  description?: string;
  defaultValue: string;
  format?: PlatformTextFormat;
};

export type PlatformTextRecord = {
  key: string;
  category: string;
  locale: string;
  value: string;
  defaultValue: string;
  label: string | null;
  description: string | null;
  format: PlatformTextFormat;
  version: number;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  isCustomized: boolean;
};

export type PlatformTextVersionRecord = {
  id: string;
  textKey: string;
  version: number;
  value: string;
  changedBy: string | null;
  changeNote: string | null;
  createdAt: string;
};

export type PlatformTextChangeLogRecord = {
  id: string;
  textKey: string;
  action: string;
  oldValue: string | null;
  newValue: string | null;
  userId: string | null;
  createdAt: string;
};

export type PlatformTextServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

export const PLATFORM_TEXT_CATEGORIES: {
  id: PlatformTextCategory;
  label: string;
}[] = [
  { id: "headings", label: "Überschriften" },
  { id: "text", label: "Fließtexte" },
  { id: "buttons", label: "Buttons" },
  { id: "menu", label: "Menüs" },
  { id: "footer", label: "Footer" },
  { id: "dashboard", label: "Dashboard" },
  { id: "courses", label: "Kurse" },
  { id: "member", label: "Mitgliederbereich" },
  { id: "forum", label: "Forum" },
  { id: "tickets", label: "Ticketsystem" },
  { id: "blog", label: "Blog / Magazin" },
  { id: "forms", label: "Formulare" },
  { id: "errors", label: "Fehlermeldungen" },
  { id: "success", label: "Erfolgsmeldungen" },
  { id: "auth", label: "Login / Registrierung" },
  { id: "checkout", label: "Checkout" },
  { id: "emails", label: "E-Mail-Vorlagen" },
  { id: "legal", label: "Rechtliches" },
  { id: "account", label: "Konto / Bestellungen" },
  { id: "privacy", label: "Datenschutz" },
  { id: "admin", label: "Administration" },
];
