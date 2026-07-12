/**
 * @file stripe-client.ts
 * @purpose Stripe SDK-Client (serverseitig, Restricted Key bevorzugt).
 */

import Stripe from "stripe";

import type { StripeActiveMode } from "@prisma/client";

import { getStripeServerKey } from "./stripe-config";

const clients = new Map<StripeActiveMode, Stripe>();

export function getStripeClient(mode: StripeActiveMode): Stripe {
  const cached = clients.get(mode);

  if (cached) {
    return cached;
  }

  const { key: serverKey, type } = getStripeServerKey(mode);

  if (!serverKey) {
    throw new Error(
      `Stripe Server-Key für Modus "${mode}" ist nicht konfiguriert (Restricted oder Secret Key erforderlich).`,
    );
  }

  const client = new Stripe(serverKey, {
    apiVersion: "2025-02-24.acacia",
    typescript: true,
    appInfo: {
      name: "Alles-Wurst Platform",
      version: "0.1.0",
      url: "https://alles-wurst.de",
    },
  });

  clients.set(mode, client);

  if (type === "secret" && process.env.NODE_ENV === "production") {
    console.warn(
      `[stripe:${mode}] Secret Key im Einsatz — Restricted API Key (rk_*) wird empfohlen.`,
    );
  }

  return client;
}

/** Setzt den Client-Cache (z. B. nach Key-Rotation). */
export function resetStripeClients(): void {
  clients.clear();
}
