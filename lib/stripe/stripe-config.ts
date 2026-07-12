/**
 * @file stripe-config.ts
 * @purpose Stripe-Konfiguration (Admin-DB, ENV-Fallback).
 */

import type { StripeActiveMode } from "@prisma/client";

import { getResolvedStripeKeys } from "./stripe-key-store";
import {
  getStripeModeKeyReport,
  logStripeStartupValidation,
} from "./stripe-key-validation";
import type { StripeServerKeyType } from "./stripe-key-types";

export type StripeModeConfig = {
  mode: StripeActiveMode;
  serverKey: string;
  serverKeyType: StripeServerKeyType;
  publishableKey: string;
  webhookSecret: string;
};

/**
 * Serverseitiger API-Schlüssel — bevorzugt Restricted Key, Fallback Secret Key.
 */
export function getStripeServerKey(mode: StripeActiveMode): {
  key: string | null;
  type: StripeServerKeyType;
} {
  const resolved = getResolvedStripeKeys(mode);

  if (resolved.restrictedKey) {
    return { key: resolved.restrictedKey, type: "restricted" };
  }

  if (resolved.secretKey) {
    return { key: resolved.secretKey, type: "secret" };
  }

  return { key: null, type: "missing" };
}

/** @deprecated Nutze getStripeServerKey */
export function getStripeSecretKey(mode: StripeActiveMode): string | null {
  return getStripeServerKey(mode).key;
}

export function getStripePublishableKey(mode: StripeActiveMode): string | null {
  return getResolvedStripeKeys(mode).publishableKey;
}

export function getStripeWebhookSecret(mode: StripeActiveMode): string | null {
  return getResolvedStripeKeys(mode).webhookSecret;
}

export function isStripeModeConfigured(mode: StripeActiveMode): boolean {
  logStripeStartupValidation();
  return getStripeModeKeyReport(mode).checkoutAllowed;
}

export function getAppBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ??
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ??
    "http://localhost:3000"
  );
}

export function resolveStripeModeFromLivemode(livemode: boolean): StripeActiveMode {
  return livemode ? "live" : "test";
}
