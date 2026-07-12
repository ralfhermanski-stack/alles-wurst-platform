/**
 * @file recipe-form-classes.ts
 * @purpose Gemeinsame Tailwind-Klassen für Rezeptgenerator-Formulare.
 */

/** Standard-Texteingabe im dunklen Alles-Wurst-Design */
export const inputClassName =
  "w-full rounded-lg border border-aw-border bg-aw-bg px-4 py-3 text-base text-aw-cream placeholder:text-aw-muted/60 focus:border-aw-gold focus:outline-none focus:ring-1 focus:ring-aw-gold/40";

/** Select / Dropdown */
export const selectClassName =
  "w-full rounded-lg border border-aw-border bg-aw-bg px-4 py-3 text-base text-aw-cream focus:border-aw-gold focus:outline-none focus:ring-1 focus:ring-aw-gold/40";

/** Primärer Gold-Button */
export const primaryButtonClassName =
  "inline-flex items-center justify-center rounded-lg bg-aw-gold px-5 py-2.5 text-sm font-semibold text-aw-bg transition-colors hover:bg-aw-cream disabled:cursor-not-allowed disabled:opacity-50";

/** Sekundärer Button */
export const secondaryButtonClassName =
  "inline-flex items-center justify-center rounded-lg border border-aw-border bg-aw-surface-2 px-5 py-2.5 text-sm font-semibold text-aw-cream transition-colors hover:border-aw-gold/50 hover:text-aw-gold disabled:cursor-not-allowed disabled:opacity-50";

/** Gefahr / Löschen */
export const dangerButtonClassName =
  "inline-flex items-center justify-center rounded-lg border border-aw-warning/40 bg-aw-warning/10 px-4 py-2 text-sm font-semibold text-aw-warning transition-colors hover:bg-aw-warning/20 disabled:opacity-50";

/** Karten-Container für Wizard-Abschnitte */
export const sectionCardClassName =
  "rounded-xl border border-aw-border bg-aw-surface/60 p-5 sm:p-6";

/** Feld-Beschriftung */
export const labelClassName = "block text-sm font-semibold text-aw-cream";
