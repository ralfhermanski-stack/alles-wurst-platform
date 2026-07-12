/**
 * @file stripe-key-validation.ts
 * @purpose Validierung der Stripe-Schlüssel (Test/Live-Trennung, Best Practices).
 */

import type { StripeActiveMode } from "@prisma/client";

import {
  detectStripeKeyKind,
  maskStripeKey,
  stripeKeyConflictsMode,
  stripeKeyMatchesMode,
  type StripeKeyKind,
  type StripeServerKeyType,
} from "./stripe-key-types";
import { getResolvedStripeKeys } from "./stripe-key-store";

export type StripeModeKeyReport = {
  mode: StripeActiveMode;
  publishableKeyPresent: boolean;
  publishableKeyMasked: string | null;
  publishableKeyValid: boolean;
  serverKeyType: StripeServerKeyType;
  serverKeyMasked: string | null;
  serverKeyValid: boolean;
  webhookSecretPresent: boolean;
  webhookSecretMasked: string | null;
  webhookSecretValid: boolean;
  keysCorrect: boolean;
  checkoutAllowed: boolean;
  warnings: string[];
  errors: string[];
};

function readEnv(name: string): string | null {
  const value = process.env[name]?.trim();
  return value || null;
}

export function getStripeEnvMode(): StripeActiveMode | null {
  const raw = readEnv("STRIPE_MODE")?.toLowerCase();

  if (raw === "test" || raw === "live") {
    return raw;
  }

  return null;
}

function validateSingleKey(input: {
  value: string | null;
  expectedKind: StripeKeyKind;
  mode: StripeActiveMode;
  label: string;
}): { valid: boolean; error?: string } {
  if (!input.value) {
    return { valid: false, error: `${input.label} fehlt.` };
  }

  const kind = detectStripeKeyKind(input.value);

  if (kind === "unknown") {
    return { valid: false, error: `${input.label} hat ein unbekanntes Format.` };
  }

  if (kind !== input.expectedKind) {
    return {
      valid: false,
      error: `${input.label} hat falschen Typ (erwartet: ${input.expectedKind}, erkannt: ${kind}).`,
    };
  }

  if (
    input.expectedKind !== "webhook" &&
    stripeKeyConflictsMode(input.value, input.mode)
  ) {
    return {
      valid: false,
      error: `${input.label} passt nicht zum Modus "${input.mode}".`,
    };
  }

  if (
    input.expectedKind === "webhook" &&
    !input.value.startsWith("whsec_")
  ) {
    return { valid: false, error: `${input.label} muss mit whsec_ beginnen.` };
  }

  if (
    input.expectedKind !== "webhook" &&
    !stripeKeyMatchesMode(input.value, input.expectedKind, input.mode)
  ) {
    return {
      valid: false,
      error: `${input.label} passt nicht zum Modus "${input.mode}".`,
    };
  }

  return { valid: true };
}

function readPublishableKey(mode: StripeActiveMode): string | null {
  return getResolvedStripeKeys(mode).publishableKey;
}

function readRestrictedKey(mode: StripeActiveMode): string | null {
  return getResolvedStripeKeys(mode).restrictedKey;
}

function readSecretKey(mode: StripeActiveMode): string | null {
  return getResolvedStripeKeys(mode).secretKey;
}

function readWebhookSecret(mode: StripeActiveMode): string | null {
  return getResolvedStripeKeys(mode).webhookSecret;
}

function readServerKey(mode: StripeActiveMode): {
  type: StripeServerKeyType;
  value: string | null;
} {
  const restricted = readRestrictedKey(mode);

  if (restricted) {
    return { type: "restricted", value: restricted };
  }

  const secret = readSecretKey(mode);

  if (secret) {
    return { type: "secret", value: secret };
  }

  return { type: "missing", value: null };
}

function collectCrossModeErrors(mode: StripeActiveMode): string[] {
  const errors: string[] = [];
  const opposite: StripeActiveMode = mode === "test" ? "live" : "test";

  const envPairs: Array<{ name: string; value: string | null }> = [
    { name: `Publishable Key (${mode})`, value: readPublishableKey(mode) },
    { name: `Restricted Key (${mode})`, value: readRestrictedKey(mode) },
    { name: `Secret Key (${mode})`, value: readSecretKey(mode) },
    { name: `Webhook Secret (${mode})`, value: readWebhookSecret(mode) },
  ];

  for (const pair of envPairs) {
    if (pair.value && stripeKeyConflictsMode(pair.value, mode)) {
      errors.push(
        `${pair.name} enthält einen ${opposite}-Schlüssel, obwohl Modus "${mode}" aktiv ist.`,
      );
    }
  }

  return errors;
}

/**
 * Validiert alle Stripe-Schlüssel für einen Modus.
 */
export function validateStripeModeKeys(mode: StripeActiveMode): StripeModeKeyReport {
  const warnings: string[] = [];
  const errors: string[] = [...collectCrossModeErrors(mode)];

  const publishable = readPublishableKey(mode);
  const server = readServerKey(mode);
  const webhook = readWebhookSecret(mode);

  const publishableCheck = validateSingleKey({
    value: publishable,
    expectedKind: "publishable",
    mode,
    label: "Publishable Key",
  });

  if (!publishableCheck.valid && publishableCheck.error) {
    errors.push(publishableCheck.error);
  }

  let serverValid = false;

  if (server.type === "missing") {
    errors.push("Server-Key fehlt (Restricted oder Secret Key erforderlich).");
  } else {
    const serverCheck = validateSingleKey({
      value: server.value,
      expectedKind: server.type === "restricted" ? "restricted" : "secret",
      mode,
      label: server.type === "restricted" ? "Restricted Key" : "Secret Key",
    });

    serverValid = serverCheck.valid;

    if (!serverCheck.valid && serverCheck.error) {
      errors.push(serverCheck.error);
    }

    if (server.type === "secret") {
      warnings.push(
        "Secret Key wird verwendet — Restricted API Key (rk_*) wird empfohlen.",
      );
    }

    if (mode === "live" && server.type === "secret") {
      warnings.push(
        "Livemodus ohne Restricted Key — bitte einen eingeschränkten API-Schlüssel einrichten.",
      );
    }
  }

  const webhookCheck = validateSingleKey({
    value: webhook,
    expectedKind: "webhook",
    mode,
    label: "Webhook Signing Secret",
  });

  if (!webhookCheck.valid && webhookCheck.error) {
    errors.push(webhookCheck.error);
  }

  if (!webhook) {
    warnings.push("Webhook Signing Secret fehlt — Freischaltung per Webhook nicht möglich.");
  }

  const keysCorrect =
    publishableCheck.valid && serverValid && webhookCheck.valid && errors.length === 0;

  const checkoutAllowed =
    keysCorrect && Boolean(publishable) && server.type !== "missing" && Boolean(webhook);

  return {
    mode,
    publishableKeyPresent: Boolean(publishable),
    publishableKeyMasked: maskStripeKey(publishable),
    publishableKeyValid: publishableCheck.valid,
    serverKeyType: server.type,
    serverKeyMasked: maskStripeKey(server.value),
    serverKeyValid: serverValid,
    webhookSecretPresent: Boolean(webhook),
    webhookSecretMasked: maskStripeKey(webhook),
    webhookSecretValid: webhookCheck.valid,
    keysCorrect,
    checkoutAllowed,
    warnings,
    errors,
  };
}

let validationCache: Map<StripeActiveMode, StripeModeKeyReport> | null = null;
let startupLogged = false;

export function invalidateStripeKeyValidationCache(): void {
  validationCache = null;
}

export function getStripeModeKeyReport(
  mode: StripeActiveMode,
  refresh = false,
): StripeModeKeyReport {
  if (!validationCache || refresh) {
    validationCache = new Map([
      ["test", validateStripeModeKeys("test")],
      ["live", validateStripeModeKeys("live")],
    ]);
  }

  return validationCache.get(mode)!;
}

/**
 * Prüft STRIPE_MODE vs. Datenbank-Modus und gibt Admin-Hinweise zurück.
 */
export function validateStripeRuntimeMode(input: {
  activeMode: StripeActiveMode;
  dbMode: StripeActiveMode;
}): { effectiveMode: StripeActiveMode; warnings: string[]; errors: string[] } {
  const envMode = getStripeEnvMode();
  const warnings: string[] = [];
  const errors: string[] = [];

  if (envMode && envMode !== input.dbMode) {
    warnings.push(
      `STRIPE_MODE=${envMode} in ENV überschreibt den Admin-Modus (${input.dbMode}).`,
    );
  }

  const effectiveMode = envMode ?? input.activeMode;
  const report = getStripeModeKeyReport(effectiveMode);

  if (!report.checkoutAllowed) {
    errors.push(
      ...report.errors,
      ...report.warnings.filter((warning) => warning.includes("Webhook Signing Secret fehlt")),
    );
  }

  return { effectiveMode, warnings: [...warnings, ...report.warnings], errors };
}

/**
 * Einmalige Startvalidierung (ohne Secrets zu loggen).
 */
export function logStripeStartupValidation(): void {
  if (startupLogged) {
    return;
  }

  startupLogged = true;

  for (const mode of ["test", "live"] as const) {
    const report = getStripeModeKeyReport(mode);

    if (report.errors.length > 0) {
      console.warn(
        `[stripe:${mode}] Schlüssel-Konfiguration ungültig: ${report.errors.join(" ")}`,
      );
    }

    for (const warning of report.warnings) {
      console.warn(`[stripe:${mode}] ${warning}`);
    }
  }

  const envMode = getStripeEnvMode();

  if (envMode) {
    console.info(`[stripe] STRIPE_MODE=${envMode}`);
  }
}
