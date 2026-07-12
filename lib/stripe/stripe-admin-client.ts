/**
 * @file stripe-admin-client.ts
 * @purpose Browser-Client für Stripe-Admin-API.
 */

import type { StripeActiveMode } from "@prisma/client";

import type { StripeAdminOverview } from "./stripe-admin-service";

type ApiError = { code: string; message: string };
type ApiSuccess<T> = { success: true; data: T };
type ApiFailure = { success: false; error: ApiError };
type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

async function stripeAdminRequest<T>(
  url: string,
  options?: RequestInit,
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    const json: unknown = await response.json();

    if (
      typeof json === "object" &&
      json !== null &&
      "success" in json &&
      json.success === true &&
      "data" in json
    ) {
      return { success: true, data: json.data as T };
    }

    if (
      typeof json === "object" &&
      json !== null &&
      "success" in json &&
      json.success === false &&
      "error" in json &&
      typeof json.error === "object" &&
      json.error !== null
    ) {
      return { success: false, error: json.error as ApiError };
    }

    return {
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Unerwartete Server-Antwort." },
    };
  } catch {
    return {
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Netzwerkfehler." },
    };
  }
}

export async function fetchStripeAdminOverviewApi(): Promise<
  ApiResponse<StripeAdminOverview>
> {
  return stripeAdminRequest<StripeAdminOverview>("/api/admin/stripe");
}

export async function saveStripeKeysApi(input: {
  mode: StripeActiveMode;
  publishableKey: string;
  serverKey: string;
  webhookSecret: string;
}): Promise<ApiResponse<StripeAdminOverview & { message?: string }>> {
  return stripeAdminRequest("/api/admin/stripe/keys", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateStripeActiveModeApi(
  activeMode: StripeActiveMode,
): Promise<ApiResponse<StripeAdminOverview>> {
  return stripeAdminRequest<StripeAdminOverview>("/api/admin/stripe", {
    method: "PATCH",
    body: JSON.stringify({ activeMode }),
  });
}

export async function updateStripeKeyNotesApi(input: {
  keyStorageNoteTest?: string | null;
  keyStorageNoteLive?: string | null;
}): Promise<ApiResponse<StripeAdminOverview>> {
  return stripeAdminRequest<StripeAdminOverview>("/api/admin/stripe", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function testStripeApiKeysApi(
  mode?: StripeActiveMode,
): Promise<
  ApiResponse<{ mode: StripeActiveMode; ok: boolean; message: string }>
> {
  return stripeAdminRequest("/api/admin/stripe/test-api", {
    method: "POST",
    body: JSON.stringify(mode ? { mode } : {}),
  });
}

export type StripeTestProductPrice = {
  id: string;
  label: string;
  kind: string;
  grossAmount: number;
};

export async function fetchStripeTestPricesApi(): Promise<
  ApiResponse<{ prices: StripeTestProductPrice[] }>
> {
  return stripeAdminRequest("/api/admin/stripe/test-checkout");
}

export async function createStripeTestCheckoutApi(
  productPriceId: string,
): Promise<
  ApiResponse<{ checkoutId: string; checkoutUrl: string }>
> {
  return stripeAdminRequest("/api/admin/stripe/test-checkout", {
    method: "POST",
    body: JSON.stringify({ productPriceId }),
  });
}
