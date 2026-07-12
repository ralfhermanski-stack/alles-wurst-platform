/**
 * @file stripe-metadata.ts
 * @purpose Metadaten-Mapping für Stripe Checkout Sessions.
 */

import type { ProductKind } from "@prisma/client";

export type StripeProductType = "course" | "membership" | "bundle" | "manual";

export type StripeCheckoutMetadata = {
  user_id: string;
  user_email: string;
  user_name: string;
  course_id: string;
  membership_id: string;
  order_id: string;
  internal_booking_id: string;
  product_type: StripeProductType;
  product_name: string;
  amount: string;
  currency: string;
  billing_reference: string;
  source: "alles-wurst";
  environment: "test" | "live";
  product_id: string;
  product_price_id: string;
  payment_intent_id: string;
  access_mode?: string;
  immediate_access?: string;
  withdrawal_loss_ack?: string;
  consent_version?: string;
  terms_checksum?: string;
};

export function resolveStripeProductType(kind: ProductKind): StripeProductType {
  switch (kind) {
    case "membership_wurstclub":
    case "membership_meisterclub":
      return "membership";
    case "course":
    case "workshop":
      return "course";
    default: {
      const exhaustive: never = kind;
      return exhaustive;
    }
  }
}

export function buildStripeMetadata(
  input: Omit<StripeCheckoutMetadata, "source"> & { source?: "alles-wurst" },
): Record<string, string> {
  const metadata: Record<string, string> = {
    user_id: input.user_id,
    user_email: input.user_email,
    user_name: input.user_name,
    course_id: input.course_id,
    membership_id: input.membership_id,
    order_id: input.order_id,
    internal_booking_id: input.internal_booking_id,
    product_type: input.product_type,
    product_name: input.product_name,
    amount: input.amount,
    currency: input.currency,
    billing_reference: input.billing_reference,
    source: input.source ?? "alles-wurst",
    environment: input.environment,
    product_id: input.product_id,
    product_price_id: input.product_price_id,
    payment_intent_id: input.payment_intent_id,
  };

  if (input.access_mode) {
    metadata.access_mode = input.access_mode;
  }

  if (input.immediate_access) {
    metadata.immediate_access = input.immediate_access;
  }

  if (input.withdrawal_loss_ack) {
    metadata.withdrawal_loss_ack = input.withdrawal_loss_ack;
  }

  if (input.consent_version) {
    metadata.consent_version = input.consent_version;
  }

  if (input.terms_checksum) {
    metadata.terms_checksum = input.terms_checksum.slice(0, 64);
  }

  return Object.fromEntries(
    Object.entries(metadata).filter(([, value]) => value.length > 0),
  );
}

export function parseStripeMetadata(
  metadata: Record<string, string> | null | undefined,
): Partial<StripeCheckoutMetadata> {
  if (!metadata) {
    return {};
  }

  return metadata as Partial<StripeCheckoutMetadata>;
}

export function buildClientReferenceId(checkoutIntentId: string): string {
  return `AW-${checkoutIntentId.replace(/-/g, "").slice(0, 12).toUpperCase()}`;
}
