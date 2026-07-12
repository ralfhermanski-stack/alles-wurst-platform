/**
 * @file stripe-settings-service.ts
 * @purpose Stripe-Einstellungen (Singleton), Status und Key-Validierung.
 */

import type { StripeActiveMode } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

import { isStripeModeConfigured } from "./stripe-config";
import {
  ensureStripeKeyCache,
  getResolvedStripeKeys,
} from "./stripe-key-store";
import {
  getStripeEnvMode,
  getStripeModeKeyReport,
  logStripeStartupValidation,
  validateStripeRuntimeMode,
  type StripeModeKeyReport,
} from "./stripe-key-validation";

export type StripeModeStatus = StripeModeKeyReport & {
  configured: boolean;
  apiTestOk: boolean | null;
  apiTestCheckedAt: string | null;
  keysSavedInAdmin: boolean;
  keysSavedAt: string | null;
};

export type StripeAdminStatus = {
  activeMode: StripeActiveMode;
  effectiveMode: StripeActiveMode;
  envMode: StripeActiveMode | null;
  test: StripeModeStatus;
  live: StripeModeStatus;
  checkoutEnabled: boolean;
  webhookConnected: boolean;
  lastWebhookAt: string | null;
  lastWebhookEventId: string | null;
  lastStripeError: string | null;
  webhookUrl: string;
  globalWarnings: string[];
  globalErrors: string[];
  keyStorageNoteTest: string | null;
  keyStorageNoteLive: string | null;
  keyRotatedAtTest: string | null;
  keyRotatedAtLive: string | null;
};

function buildModeStatus(
  mode: StripeActiveMode,
  settings: {
    apiTestOk: boolean | null;
    apiTestCheckedAt: Date | null;
    apiLiveOk: boolean | null;
    apiLiveCheckedAt: Date | null;
  },
): StripeModeStatus {
  const report = getStripeModeKeyReport(mode);
  const resolved = getResolvedStripeKeys(mode);

  return {
    ...report,
    configured: report.checkoutAllowed,
    keysSavedInAdmin: resolved.source === "admin",
    keysSavedAt: resolved.savedAt,
    apiTestOk: mode === "live" ? settings.apiLiveOk : settings.apiTestOk,
    apiTestCheckedAt:
      mode === "live"
        ? settings.apiLiveCheckedAt?.toISOString() ?? null
        : settings.apiTestCheckedAt?.toISOString() ?? null,
  };
}

export async function getOrCreateStripeSettings() {
  const existing = await prisma.stripeSettings.findUnique({
    where: { id: "default" },
  });

  if (existing) {
    return existing;
  }

  return prisma.stripeSettings.create({
    data: { id: "default" },
  });
}

export function getStripeWebhookUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ??
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ??
    "http://localhost:3000";

  return `${base}/api/stripe/webhook`;
}

export async function getStripeAdminStatus(): Promise<StripeAdminStatus> {
  await ensureStripeKeyCache();
  logStripeStartupValidation();

  const settings = await getOrCreateStripeSettings();
  const runtime = validateStripeRuntimeMode({
    activeMode: settings.activeMode,
    dbMode: settings.activeMode,
  });

  const test = buildModeStatus("test", settings);
  const live = buildModeStatus("live", settings);
  const activeReport = runtime.effectiveMode === "live" ? live : test;

  const webhookConnected = Boolean(
    settings.lastWebhookAt &&
      Date.now() - settings.lastWebhookAt.getTime() < 7 * 24 * 60 * 60 * 1000,
  );

  return {
    activeMode: settings.activeMode,
    effectiveMode: runtime.effectiveMode,
    envMode: getStripeEnvMode(),
    test,
    live,
    checkoutEnabled: activeReport.checkoutAllowed,
    webhookConnected,
    lastWebhookAt: settings.lastWebhookAt?.toISOString() ?? null,
    lastWebhookEventId: settings.lastWebhookEventId,
    lastStripeError: settings.lastStripeError,
    webhookUrl: getStripeWebhookUrl(),
    globalWarnings: [...runtime.warnings, ...activeReport.warnings],
    globalErrors: activeReport.errors,
    keyStorageNoteTest: settings.keyStorageNoteTest,
    keyStorageNoteLive: settings.keyStorageNoteLive,
    keyRotatedAtTest: settings.keyRotatedAtTest?.toISOString() ?? null,
    keyRotatedAtLive: settings.keyRotatedAtLive?.toISOString() ?? null,
  };
}

export async function setStripeActiveMode(
  mode: StripeActiveMode,
): Promise<StripeAdminStatus> {
  const envMode = getStripeEnvMode();

  if (envMode && envMode !== mode) {
    throw new Error(
      `STRIPE_MODE=${envMode} in ENV überschreibt den Admin-Modus. Bitte ENV anpassen oder entfernen.`,
    );
  }

  if (!isStripeModeConfigured(mode)) {
    const report = getStripeModeKeyReport(mode);

    throw new Error(
      report.errors[0] ??
        `Stripe-Modus "${mode}" ist nicht vollständig oder korrekt konfiguriert.`,
    );
  }

  await prisma.stripeSettings.update({
    where: { id: "default" },
    data: { activeMode: mode },
  });

  return getStripeAdminStatus();
}

export async function updateStripeKeyNotes(input: {
  keyStorageNoteTest?: string | null;
  keyStorageNoteLive?: string | null;
  keyRotatedAtTest?: string | null;
  keyRotatedAtLive?: string | null;
}): Promise<StripeAdminStatus> {
  await prisma.stripeSettings.update({
    where: { id: "default" },
    data: {
      keyStorageNoteTest: input.keyStorageNoteTest?.trim() || null,
      keyStorageNoteLive: input.keyStorageNoteLive?.trim() || null,
      keyRotatedAtTest: input.keyRotatedAtTest
        ? new Date(input.keyRotatedAtTest)
        : undefined,
      keyRotatedAtLive: input.keyRotatedAtLive
        ? new Date(input.keyRotatedAtLive)
        : undefined,
    },
  });

  return getStripeAdminStatus();
}

export async function recordStripeWebhookReceived(eventId: string): Promise<void> {
  await prisma.stripeSettings.update({
    where: { id: "default" },
    data: {
      lastWebhookAt: new Date(),
      lastWebhookEventId: eventId,
      lastStripeError: null,
    },
  });
}

export async function recordStripeError(message: string): Promise<void> {
  const sanitized = message
    .replace(/sk_(test|live)_[A-Za-z0-9]+/g, "sk_****")
    .replace(/rk_(test|live)_[A-Za-z0-9]+/g, "rk_****")
    .replace(/whsec_[A-Za-z0-9]+/g, "whsec_****");

  await prisma.stripeSettings.update({
    where: { id: "default" },
    data: { lastStripeError: sanitized.slice(0, 4000) },
  });
}

export async function recordStripeApiTestResult(
  mode: StripeActiveMode,
  ok: boolean,
): Promise<void> {
  const now = new Date();

  if (mode === "live") {
    await prisma.stripeSettings.update({
      where: { id: "default" },
      data: {
        apiLiveOk: ok,
        apiLiveCheckedAt: now,
        lastStripeError: ok ? null : undefined,
      },
    });

    return;
  }

  await prisma.stripeSettings.update({
    where: { id: "default" },
    data: {
      apiTestOk: ok,
      apiTestCheckedAt: now,
      lastStripeError: ok ? null : undefined,
    },
  });
}

export async function getActiveStripeMode(): Promise<StripeActiveMode> {
  const envMode = getStripeEnvMode();

  if (envMode) {
    return envMode;
  }

  const settings = await getOrCreateStripeSettings();
  return settings.activeMode;
}

export async function isStripeCheckoutEnabled(): Promise<boolean> {
  await ensureStripeKeyCache();
  logStripeStartupValidation();

  const mode = await getActiveStripeMode();
  const report = getStripeModeKeyReport(mode, true);

  return report.checkoutAllowed;
}
