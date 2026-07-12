/**
 * @file payment-types.ts
 * @purpose Typen für Checkout, Payment und Fulfillment.
 */

import type {
  BillingPeriod,
  CheckoutIntent,
  CheckoutIntentStatus,
  CourseAccess,
  CourseAccessStatus,
  PaymentIntent,
  PaymentIntentStatus,
  PaymentProvider,
  Product,
  ProductKind,
  ProductPrice,
} from "@prisma/client";

import type { PurchaseEvidence } from "@/lib/legal/purchase-evidence";

export type ProductEntry = {
  id: string;
  kind: ProductKind;
  slug: string;
  name: string;
  description: string | null;
  active: boolean;
  sortOrder: number;
  externalRef: string | null;
  legalProductType: string | null;
  legalConfig: unknown;
};

export type ProductPriceEntry = {
  id: string;
  productId: string;
  grossAmount: number;
  netAmount: number;
  taxRate: number;
  taxAmount: number;
  currency: string;
  billingPeriod: BillingPeriod;
  active: boolean;
};

export type ProductWithPrices = ProductEntry & {
  prices: ProductPriceEntry[];
};

export type CheckoutIntentEntry = {
  id: string;
  userId: string;
  productPriceId: string;
  paymentProvider: PaymentProvider;
  status: CheckoutIntentStatus;
  grossAmount: number;
  netAmount: number;
  taxRate: number;
  taxAmount: number;
  currency: string;
  accountingPositionId: string | null;
  expiresAt: string | null;
  completedAt: string | null;
  createdAt: string;
};

export type PaymentIntentEntry = {
  id: string;
  checkoutIntentId: string;
  paymentProvider: PaymentProvider;
  status: PaymentIntentStatus;
  providerReference: string | null;
  grossAmount: number;
  currency: string;
  accountingPositionId: string | null;
  paidAt: string | null;
  failedAt: string | null;
  createdAt: string;
};

export type CreateCheckoutIntentInput = {
  userId: string;
  productPriceId: string;
  paymentProvider: PaymentProvider;
  dueDate?: string | null;
  note?: string | null;
  evidence?: PurchaseEvidence;
  legalConsents?: {
    termsAccepted: boolean;
    privacyAcknowledged: boolean;
    immediateAccessConsent?: boolean | null;
    withdrawalLossAcknowledged?: boolean | null;
  };
};

export type CreatePaymentIntentInput = {
  checkoutIntentId: string;
  providerReference?: string | null;
  providerMetadata?: Record<string, string | number | boolean | null>;
};

export type LinkAccountingPositionInput = {
  accountingPositionId: string;
  checkoutIntentId: string;
};

export type FulfillmentResult = {
  kind: "membership" | "course_access" | "none";
  membershipRole?: "wurstclub" | "meisterclub";
  courseAccessId?: string;
};

export function toProductEntry(product: Product): ProductEntry {
  return {
    id: product.id,
    kind: product.kind,
    slug: product.slug,
    name: product.name,
    description: product.description,
    active: product.active,
    sortOrder: product.sortOrder,
    externalRef: product.externalRef,
    legalProductType: product.legalProductType ?? null,
    legalConfig: product.legalConfig ?? null,
  };
}

export function toProductPriceEntry(price: ProductPrice): ProductPriceEntry {
  return {
    id: price.id,
    productId: price.productId,
    grossAmount: price.grossAmount.toNumber(),
    netAmount: price.netAmount.toNumber(),
    taxRate: price.taxRate.toNumber(),
    taxAmount: price.taxAmount.toNumber(),
    currency: price.currency,
    billingPeriod: price.billingPeriod,
    active: price.active,
  };
}

export function toCheckoutIntentEntry(
  checkout: CheckoutIntent,
): CheckoutIntentEntry {
  return {
    id: checkout.id,
    userId: checkout.userId,
    productPriceId: checkout.productPriceId,
    paymentProvider: checkout.paymentProvider,
    status: checkout.status,
    grossAmount: checkout.grossAmount.toNumber(),
    netAmount: checkout.netAmount.toNumber(),
    taxRate: checkout.taxRate.toNumber(),
    taxAmount: checkout.taxAmount.toNumber(),
    currency: checkout.currency,
    accountingPositionId: checkout.accountingPositionId,
    expiresAt: checkout.expiresAt?.toISOString() ?? null,
    completedAt: checkout.completedAt?.toISOString() ?? null,
    createdAt: checkout.createdAt.toISOString(),
  };
}

export function toPaymentIntentEntry(
  payment: PaymentIntent,
): PaymentIntentEntry {
  return {
    id: payment.id,
    checkoutIntentId: payment.checkoutIntentId,
    paymentProvider: payment.paymentProvider,
    status: payment.status,
    providerReference: payment.providerReference,
    grossAmount: payment.grossAmount.toNumber(),
    currency: payment.currency,
    accountingPositionId: payment.accountingPositionId,
    paidAt: payment.paidAt?.toISOString() ?? null,
    failedAt: payment.failedAt?.toISOString() ?? null,
    createdAt: payment.createdAt.toISOString(),
  };
}

export function toCourseAccessEntry(access: CourseAccess) {
  return {
    id: access.id,
    userId: access.userId,
    productId: access.productId,
    status: access.status as CourseAccessStatus,
    source: access.source,
    checkoutIntentId: access.checkoutIntentId,
    accountingPositionId: access.accountingPositionId,
    grantedAt: access.grantedAt?.toISOString() ?? null,
    expiresAt: access.expiresAt?.toISOString() ?? null,
  };
}
