import { getSessionUserIdFromRequest } from "@/lib/auth/session";
import { collectPurchaseEvidence } from "@/lib/legal/purchase-evidence";
import { prisma } from "@/lib/db/prisma";
import { createCheckoutIntent } from "@/lib/payments/checkout-intent-service";
import {
  getStringField,
  jsonFromCheckoutResult,
  parseJsonBody,
} from "@/lib/payments/checkout-api-utils";
import { getCheckoutUiProviders } from "@/lib/payments/checkout-query-service";
import { createStripeCheckoutSession } from "@/lib/stripe/stripe-checkout-service";
import { isStripeCheckoutEnabled } from "@/lib/stripe/stripe-settings-service";
import { userFailure, userSuccess } from "@/lib/users/user-errors";
import type { PaymentProvider } from "@prisma/client";

function parsePaymentProvider(value: string | null): PaymentProvider | null {
  if (!value) {
    return null;
  }

  if (
    value === "bank_transfer" ||
    value === "manual" ||
    value === "stripe"
  ) {
    return value;
  }

  return null;
}

function parseBooleanField(body: Record<string, unknown>, key: string): boolean {
  const value = body[key];
  return value === true || value === "true" || value === 1 || value === "1";
}

function parseNullableBooleanField(
  body: Record<string, unknown>,
  key: string,
): boolean | null | undefined {
  if (!(key in body)) {
    return undefined;
  }

  const value = body[key];

  if (value === null || value === "null") {
    return null;
  }

  if (value === true || value === "true" || value === 1 || value === "1") {
    return true;
  }

  if (value === false || value === "false" || value === 0 || value === "0") {
    return false;
  }

  return null;
}

/**
 * POST /api/checkout — Checkout-Intent anlegen (bank_transfer, manual, stripe).
 */
export async function POST(request: Request): Promise<Response> {
  const userId = await getSessionUserIdFromRequest(request);

  if (!userId) {
    return jsonFromCheckoutResult(
      userFailure({
        code: "FORBIDDEN",
        message: "Bitte melde dich an, um einen Kauf vorzubereiten.",
      }),
    );
  }

  const body = await parseJsonBody(request);
  const productPriceId = body ? getStringField(body, "productPriceId") : null;
  const paymentProviderRaw = body
    ? getStringField(body, "paymentProvider")
    : null;
  const paymentProvider = parsePaymentProvider(paymentProviderRaw ?? null);

  if (!productPriceId || !paymentProvider) {
    return jsonFromCheckoutResult(
      userFailure({
        code: "VALIDATION_ERROR",
        message: "Produktpreis und Zahlungsart sind erforderlich.",
      }),
    );
  }

  const uiProviders = await getCheckoutUiProviders();

  if (!uiProviders.includes(paymentProvider)) {
    return jsonFromCheckoutResult(
      userFailure({
        code: "VALIDATION_ERROR",
        message: "Diese Zahlungsart ist im Checkout noch nicht verfügbar.",
      }),
    );
  }

  if (paymentProvider === "stripe" && !(await isStripeCheckoutEnabled())) {
    return jsonFromCheckoutResult(
      userFailure({
        code: "VALIDATION_ERROR",
        message:
          "Zahlung per Stripe ist aktuell nicht verfügbar.",
      }),
    );
  }

  const result = await createCheckoutIntent({
    userId,
    productPriceId,
    paymentProvider,
    evidence: collectPurchaseEvidence({ request }),
    legalConsents: body
      ? {
          termsAccepted: parseBooleanField(body, "termsAccepted"),
          privacyAcknowledged: parseBooleanField(body, "privacyAcknowledged"),
          immediateAccessConsent: parseNullableBooleanField(
            body,
            "immediateAccessConsent",
          ),
          withdrawalLossAcknowledged: parseNullableBooleanField(
            body,
            "withdrawalLossAcknowledged",
          ),
        }
      : undefined,
  });

  if (!result.success) {
    return jsonFromCheckoutResult(result);
  }

  if (paymentProvider === "stripe") {
    const payment = await prisma.paymentIntent.findFirst({
      where: { checkoutIntentId: result.data.id },
      orderBy: { createdAt: "desc" },
    });

    if (!payment) {
      return jsonFromCheckoutResult(
        userFailure({
          code: "INTERNAL_ERROR",
          message: "Stripe-Zahlung konnte nicht vorbereitet werden.",
        }),
      );
    }

    try {
      const session = await createStripeCheckoutSession({
        checkoutIntentId: result.data.id,
        paymentIntentId: payment.id,
        userId,
      });

      return jsonFromCheckoutResult(
        userSuccess({
          checkoutId: result.data.id,
          redirectUrl: session.checkoutUrl,
        }),
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Stripe Checkout konnte nicht erstellt werden.";

      return jsonFromCheckoutResult(
        userFailure({
          code: "INTERNAL_ERROR",
          message,
        }),
      );
    }
  }

  return jsonFromCheckoutResult(
    userSuccess({ checkoutId: result.data.id }),
  );
}
