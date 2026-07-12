/**
 * @file stripe-key-store.ts
 * @purpose Stripe-Schlüssel aus Admin-DB (verschlüsselt) oder ENV auflösen.
 */

import type { StripeActiveMode } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

import { resetStripeClients } from "./stripe-client";
import {
  decryptStripeKeyPayload,
  encryptStripeKeyPayload,
} from "./stripe-key-crypto";
import { detectStripeKeyKind } from "./stripe-key-types";
import { invalidateStripeKeyValidationCache } from "./stripe-key-validation";

export type StripeStoredKeys = {
  publishableKey: string;
  restrictedKey: string | null;
  secretKey: string | null;
  webhookSecret: string;
};

export type StripeResolvedKeys = {
  publishableKey: string | null;
  restrictedKey: string | null;
  secretKey: string | null;
  webhookSecret: string | null;
  source: "admin" | "env" | "mixed" | "none";
  savedAt: string | null;
};

function readEnv(name: string): string | null {
  const value = process.env[name]?.trim();
  return value || null;
}

function readKeysFromEnv(mode: StripeActiveMode): StripeResolvedKeys {
  const publishable =
    mode === "live"
      ? (readEnv("STRIPE_PUBLISHABLE_KEY_LIVE") ??
        readEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE"))
      : (readEnv("STRIPE_PUBLISHABLE_KEY_TEST") ??
        readEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST"));

  const restricted =
    mode === "live"
      ? readEnv("STRIPE_RESTRICTED_KEY_LIVE")
      : readEnv("STRIPE_RESTRICTED_KEY_TEST");

  const secret =
    mode === "live"
      ? (readEnv("STRIPE_SECRET_KEY_LIVE") ?? readEnv("STRIPE_SECRET_KEY"))
      : (readEnv("STRIPE_SECRET_KEY_TEST") ?? readEnv("STRIPE_SECRET_KEY"));

  const webhook =
    mode === "live"
      ? readEnv("STRIPE_WEBHOOK_SECRET_LIVE")
      : readEnv("STRIPE_WEBHOOK_SECRET_TEST");

  const hasAny = Boolean(publishable || restricted || secret || webhook);

  return {
    publishableKey: publishable,
    restrictedKey: restricted,
    secretKey: secret,
    webhookSecret: webhook,
    source: hasAny ? "env" : "none",
    savedAt: null,
  };
}

function parseStoredPayload(json: string): StripeStoredKeys {
  const parsed = JSON.parse(json) as Partial<StripeStoredKeys>;

  if (!parsed.publishableKey?.trim() || !parsed.webhookSecret?.trim()) {
    throw new Error("Gespeicherte Stripe-Schlüssel sind unvollständig.");
  }

  return {
    publishableKey: parsed.publishableKey.trim(),
    restrictedKey: parsed.restrictedKey?.trim() || null,
    secretKey: parsed.secretKey?.trim() || null,
    webhookSecret: parsed.webhookSecret.trim(),
  };
}

function storedToResolved(
  stored: StripeStoredKeys,
  savedAt: Date | null,
): StripeResolvedKeys {
  return {
    publishableKey: stored.publishableKey,
    restrictedKey: stored.restrictedKey,
    secretKey: stored.secretKey,
    webhookSecret: stored.webhookSecret,
    source: "admin",
    savedAt: savedAt?.toISOString() ?? null,
  };
}

const resolvedCache: Partial<Record<StripeActiveMode, StripeResolvedKeys>> = {};
let cacheReady = false;

export function invalidateStripeKeyCache(): void {
  cacheReady = false;
  delete resolvedCache.test;
  delete resolvedCache.live;
  invalidateStripeKeyValidationCache();
  resetStripeClients();
}

async function loadStoredKeysFromDb(
  mode: StripeActiveMode,
): Promise<{ keys: StripeStoredKeys; savedAt: Date | null } | null> {
  const settings = await prisma.stripeSettings.findUnique({
    where: { id: "default" },
    select: {
      encryptedKeysTest: true,
      encryptedKeysLive: true,
      keysSavedAtTest: true,
      keysSavedAtLive: true,
    },
  });

  if (!settings) {
    return null;
  }

  const encrypted =
    mode === "live" ? settings.encryptedKeysLive : settings.encryptedKeysTest;
  const savedAt =
    mode === "live" ? settings.keysSavedAtLive : settings.keysSavedAtTest;

  if (!encrypted) {
    return null;
  }

  const plaintext = decryptStripeKeyPayload(encrypted);

  return {
    keys: parseStoredPayload(plaintext),
    savedAt,
  };
}

function mergeResolved(
  admin: StripeResolvedKeys | null,
  env: StripeResolvedKeys,
): StripeResolvedKeys {
  if (admin) {
    return admin;
  }

  return env;
}

export async function ensureStripeKeyCache(): Promise<void> {
  if (cacheReady) {
    return;
  }

  for (const mode of ["test", "live"] as const) {
    const envKeys = readKeysFromEnv(mode);
    const stored = await loadStoredKeysFromDb(mode);

    resolvedCache[mode] = mergeResolved(
      stored ? storedToResolved(stored.keys, stored.savedAt) : null,
      envKeys,
    );
  }

  cacheReady = true;
}

export function getResolvedStripeKeys(mode: StripeActiveMode): StripeResolvedKeys {
  if (cacheReady && resolvedCache[mode]) {
    return resolvedCache[mode]!;
  }

  return readKeysFromEnv(mode);
}

export function hasAdminStoredKeys(mode: StripeActiveMode): boolean {
  const keys = getResolvedStripeKeys(mode);
  return keys.source === "admin";
}

export type SaveStripeKeysInput = {
  mode: StripeActiveMode;
  publishableKey: string;
  serverKey: string;
  webhookSecret: string;
};

export async function saveStripeKeysInAdmin(
  input: SaveStripeKeysInput,
): Promise<void> {
  const publishableKey = input.publishableKey.trim();
  const serverKey = input.serverKey.trim();
  const webhookSecret = input.webhookSecret.trim();

  if (!publishableKey || !serverKey || !webhookSecret) {
    throw new Error("Bitte alle drei Felder ausfüllen.");
  }

  const publishableKind = detectStripeKeyKind(publishableKey);
  const serverKind = detectStripeKeyKind(serverKey);
  const webhookKind = detectStripeKeyKind(webhookSecret);

  if (publishableKind !== "publishable") {
    throw new Error("Öffentlicher Schlüssel muss mit pk_test_ oder pk_live_ beginnen.");
  }

  if (serverKind !== "restricted" && serverKind !== "secret") {
    throw new Error(
      "Server-Schlüssel muss mit rk_test_, rk_live_, sk_test_ oder sk_live_ beginnen.",
    );
  }

  if (webhookKind !== "webhook") {
    throw new Error("Webhook-Geheimnis muss mit whsec_ beginnen.");
  }

  const pkPrefix = input.mode === "live" ? "pk_live_" : "pk_test_";
  const rkPrefix = input.mode === "live" ? "rk_live_" : "rk_test_";
  const skPrefix = input.mode === "live" ? "sk_live_" : "sk_test_";

  if (!publishableKey.startsWith(pkPrefix)) {
    throw new Error(
      `Öffentlicher Schlüssel muss mit ${pkPrefix} beginnen (Modus: ${input.mode}).`,
    );
  }

  if (
    !serverKey.startsWith(rkPrefix) &&
    !serverKey.startsWith(skPrefix)
  ) {
    throw new Error(
      `Server-Schlüssel muss mit ${rkPrefix} oder ${skPrefix} beginnen.`,
    );
  }

  const payload: StripeStoredKeys = {
    publishableKey,
    restrictedKey: serverKind === "restricted" ? serverKey : null,
    secretKey: serverKind === "secret" ? serverKey : null,
    webhookSecret,
  };

  const encrypted = encryptStripeKeyPayload(JSON.stringify(payload));
  const now = new Date();

  await prisma.stripeSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      ...(input.mode === "live"
        ? {
            encryptedKeysLive: encrypted,
            keysSavedAtLive: now,
            keyRotatedAtLive: now,
          }
        : {
            encryptedKeysTest: encrypted,
            keysSavedAtTest: now,
            keyRotatedAtTest: now,
          }),
    },
    update:
      input.mode === "live"
        ? {
            encryptedKeysLive: encrypted,
            keysSavedAtLive: now,
            keyRotatedAtLive: now,
          }
        : {
            encryptedKeysTest: encrypted,
            keysSavedAtTest: now,
            keyRotatedAtTest: now,
          },
  });

  invalidateStripeKeyCache();
  await ensureStripeKeyCache();
}
