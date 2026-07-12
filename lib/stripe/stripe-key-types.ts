/**
 * @file stripe-key-types.ts
 * @purpose Stripe-Schlüsseltypen erkennen und maskieren.
 */

import type { StripeActiveMode } from "@prisma/client";

export type StripeKeyKind =
  | "publishable"
  | "restricted"
  | "secret"
  | "webhook"
  | "unknown";

export type StripeServerKeyType = "restricted" | "secret" | "missing";

const PUBLISHABLE_PREFIX: Record<StripeActiveMode, string> = {
  test: "pk_test_",
  live: "pk_live_",
};

const RESTRICTED_PREFIX: Record<StripeActiveMode, string> = {
  test: "rk_test_",
  live: "rk_live_",
};

const SECRET_PREFIX: Record<StripeActiveMode, string> = {
  test: "sk_test_",
  live: "sk_live_",
};

export function detectStripeKeyKind(value: string): StripeKeyKind {
  const trimmed = value.trim();

  if (trimmed.startsWith("pk_test_") || trimmed.startsWith("pk_live_")) {
    return "publishable";
  }

  if (trimmed.startsWith("rk_test_") || trimmed.startsWith("rk_live_")) {
    return "restricted";
  }

  if (trimmed.startsWith("sk_test_") || trimmed.startsWith("sk_live_")) {
    return "secret";
  }

  if (trimmed.startsWith("whsec_")) {
    return "webhook";
  }

  return "unknown";
}

export function stripeKeyMatchesMode(
  value: string,
  kind: StripeKeyKind,
  mode: StripeActiveMode,
): boolean {
  const trimmed = value.trim();

  switch (kind) {
    case "publishable":
      return trimmed.startsWith(PUBLISHABLE_PREFIX[mode]);
    case "restricted":
      return trimmed.startsWith(RESTRICTED_PREFIX[mode]);
    case "secret":
      return trimmed.startsWith(SECRET_PREFIX[mode]);
    case "webhook":
      return trimmed.startsWith("whsec_");
    default:
      return false;
  }
}

export function stripeKeyConflictsMode(
  value: string,
  mode: StripeActiveMode,
): boolean {
  const kind = detectStripeKeyKind(value);

  if (kind === "unknown" || kind === "webhook") {
    return false;
  }

  return !stripeKeyMatchesMode(value, kind, mode);
}

/**
 * Maskiert einen Stripe-Schlüssel für die Admin-Anzeige (z. B. pk_live_****abcd).
 */
export function maskStripeKey(value: string | null | undefined): string | null {
  if (!value?.trim()) {
    return null;
  }

  const trimmed = value.trim();
  const kind = detectStripeKeyKind(trimmed);

  if (kind === "unknown") {
    return "****";
  }

  const underscoreIndex = trimmed.indexOf("_", trimmed.indexOf("_") + 1);

  if (underscoreIndex === -1) {
    return `${trimmed.slice(0, 4)}****`;
  }

  const prefix = trimmed.slice(0, underscoreIndex + 1);
  const suffix = trimmed.slice(-4);

  return `${prefix}****${suffix}`;
}

export function isForbiddenInFrontendKey(value: string): boolean {
  const kind = detectStripeKeyKind(value);

  return kind === "restricted" || kind === "secret" || kind === "webhook";
}
