/**
 * @file checkout-client.ts
 * @purpose Browser-Client für Checkout-API.
 */

import type { PaymentProvider } from "@prisma/client";
import type { UserErrorCode } from "@/lib/users/user-errors";

import type { CheckoutDetails } from "./checkout-query-service";
import type { ProductWithPrices } from "./payment-types";

type CheckoutApiError = {
  code: UserErrorCode;
  message: string;
};

type CheckoutApiSuccess<T> = { success: true; data: T };
type CheckoutApiFailure = { success: false; error: CheckoutApiError };
type CheckoutApiResponse<T> = CheckoutApiSuccess<T> | CheckoutApiFailure;

async function checkoutRequest<T>(
  url: string,
  options?: RequestInit,
): Promise<CheckoutApiResponse<T>> {
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
      return { success: false, error: json.error as CheckoutApiError };
    }

    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Unerwartete Server-Antwort.",
      },
    };
  } catch {
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Netzwerkfehler — bitte Verbindung prüfen.",
      },
    };
  }
}

export async function createCheckoutApi(input: {
  productPriceId: string;
  paymentProvider: PaymentProvider;
  termsAccepted?: boolean;
  privacyAcknowledged?: boolean;
  immediateAccessConsent?: boolean;
  withdrawalLossAcknowledged?: boolean;
}): Promise<
  CheckoutApiResponse<{ checkoutId: string; redirectUrl?: string }>
> {
  return checkoutRequest<{ checkoutId: string; redirectUrl?: string }>(
    "/api/checkout",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export async function fetchCheckoutDetailsApi(
  checkoutId: string,
): Promise<CheckoutApiResponse<CheckoutDetails | null>> {
  return checkoutRequest<CheckoutDetails | null>(`/api/checkout/${checkoutId}`);
}

export type { ProductWithPrices, CheckoutDetails };
