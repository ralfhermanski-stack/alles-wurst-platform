/**
 * @file contract-confirmation-service.ts
 * @purpose Datenmodell für professionelle Vertragsbestätigung (UI + PDF).
 */

import type { BillingPeriod, ProductKind } from "@prisma/client";

import { getInvoiceSellerConfig } from "@/lib/invoices/invoice-config";
import { formatMoney } from "@/lib/payments/format-money";
import { PAYMENT_PROVIDER_LABELS } from "@/lib/payments/payment-labels";

import {
  formatBillingPeriodLabel,
  formatRenewalConditions,
  resolveContractBenefits,
} from "./contract-product-benefits";
import {
  immediateAccessStatusLabel,
  withdrawalLossStatusLabel,
} from "./legal-consent-texts";

export type ContractParty = {
  name: string;
  lines: string[];
  email?: string | null;
};

export type ContractConfirmationView = {
  orderNumber: string;
  contractNumber: string;
  productName: string;
  membershipLabel: string | null;
  productDescription: string | null;
  contractStart: string;
  contractDuration: string;
  renewalConditions: string;
  priceLabel: string;
  benefits: string[];
  payment: {
    orderNumber: string;
    purchaseDate: string;
    paymentMethod: string;
    paymentStatus: string;
    invoiceNumber: string | null;
  };
  withdrawal: {
    immediateAccessConsented: boolean;
    withdrawalLossAcknowledged: boolean;
    immediateAccessStatus: string;
    withdrawalLossStatus: string;
    fullWithdrawalRights: boolean;
    notice: string | null;
  };
  provider: ContractParty;
  customer: ContractParty;
  documentVersions: {
    terms: string | null;
    privacy: string | null;
    withdrawal: string | null;
  };
  recordedAt: string;
};

function formatCustomerAddress(profile: {
  firstName: string;
  lastName: string;
  company: string | null;
  street: string;
  houseNumber: string;
  addressLine2: string | null;
  postalCode: string;
  city: string;
  country: string;
}): string[] {
  const name = [profile.firstName, profile.lastName].filter(Boolean).join(" ");
  const street = `${profile.street} ${profile.houseNumber}`.trim();
  const cityLine = `${profile.postalCode} ${profile.city}`.trim();

  const lines = [name];

  if (profile.company?.trim()) {
    lines.push(profile.company.trim());
  }

  lines.push(street);

  if (profile.addressLine2?.trim()) {
    lines.push(profile.addressLine2.trim());
  }

  lines.push(cityLine, profile.country);

  return lines;
}

function resolveMembershipLabel(
  productKind: ProductKind,
  billingPeriod: BillingPeriod,
): string | null {
  if (productKind === "membership_meisterclub") {
    return billingPeriod === "yearly"
      ? "Meisterklasse Wurst Club Pro"
      : "Meisterklasse Wurst Club";
  }

  if (productKind === "membership_wurstclub") {
    return billingPeriod === "yearly" ? "Wurst Club Pro" : "Wurst Club";
  }

  return null;
}

export function buildContractConfirmationView(input: {
  orderNumber: string;
  productName: string;
  productSlug: string;
  productKind: ProductKind;
  productDescription: string | null;
  billingPeriod: BillingPeriod;
  grossAmount: number;
  currency: string;
  paymentProvider: string;
  paymentStatus: string;
  paidAt: Date | null;
  createdAt: Date;
  invoiceNumber: string | null;
  immediateAccessConsented: boolean;
  withdrawalLossAcknowledged: boolean;
  membershipEndsAt: Date | null;
  recordedAt: Date;
  consentSnapshot: unknown;
  customerProfile: {
    firstName: string;
    lastName: string;
    company: string | null;
    street: string;
    houseNumber: string;
    addressLine2: string | null;
    postalCode: string;
    city: string;
    country: string;
  } | null;
  customerEmail: string;
}): ContractConfirmationView {
  const seller = getInvoiceSellerConfig();
  const purchaseDate = input.paidAt ?? input.createdAt;
  const bothConfirmed =
    input.immediateAccessConsented && input.withdrawalLossAcknowledged;

  const snapshot =
    input.consentSnapshot &&
    typeof input.consentSnapshot === "object" &&
    !Array.isArray(input.consentSnapshot)
      ? (input.consentSnapshot as Record<string, unknown>)
      : null;

  const documentVersions = snapshot?.documentVersions as
    | Record<string, { versionNumber?: number | null }>
    | undefined;

  const contractDuration =
    input.membershipEndsAt != null
      ? `Bis ${input.membershipEndsAt.toLocaleDateString("de-DE")} (${formatBillingPeriodLabel(input.billingPeriod)})`
      : formatBillingPeriodLabel(input.billingPeriod);

  return {
    orderNumber: input.orderNumber,
    contractNumber: input.orderNumber,
    productName: input.productName,
    membershipLabel: resolveMembershipLabel(input.productKind, input.billingPeriod),
    productDescription: input.productDescription,
    contractStart: purchaseDate.toLocaleDateString("de-DE"),
    contractDuration,
    renewalConditions: formatRenewalConditions({
      billingPeriod: input.billingPeriod,
      productKind: input.productKind,
    }),
    priceLabel: formatMoney(input.grossAmount, input.currency),
    benefits: resolveContractBenefits({
      productSlug: input.productSlug,
      productKind: input.productKind,
      billingPeriod: input.billingPeriod,
      productDescription: input.productDescription,
    }),
    payment: {
      orderNumber: input.orderNumber,
      purchaseDate: purchaseDate.toLocaleDateString("de-DE"),
      paymentMethod:
        PAYMENT_PROVIDER_LABELS[
          input.paymentProvider as keyof typeof PAYMENT_PROVIDER_LABELS
        ] ?? input.paymentProvider,
      paymentStatus: input.paymentStatus,
      invoiceNumber: input.invoiceNumber,
    },
    withdrawal: {
      immediateAccessConsented: input.immediateAccessConsented,
      withdrawalLossAcknowledged: input.withdrawalLossAcknowledged,
      immediateAccessStatus: immediateAccessStatusLabel(
        input.immediateAccessConsented,
      ),
      withdrawalLossStatus: withdrawalLossStatusLabel(
        input.withdrawalLossAcknowledged,
      ),
      fullWithdrawalRights: !bothConfirmed,
      notice: bothConfirmed
        ? null
        : "Für diese Bestellung gelten die gesetzlichen Widerrufsrechte gemäß der zum Kaufzeitpunkt gültigen Widerrufsbelehrung.",
    },
    provider: {
      name: "ALLES WURST",
      lines: [
        seller.name,
        `${seller.street}`,
        `${seller.postalCode} ${seller.city}`,
        seller.country,
        seller.vatId ? `USt-IdNr.: ${seller.vatId}` : "",
      ].filter(Boolean),
      email: process.env.INVOICE_SELLER_EMAIL?.trim() || "kontakt@alles-wurst.de",
    },
    customer: {
      name: input.customerProfile
        ? `${input.customerProfile.firstName} ${input.customerProfile.lastName}`.trim()
        : input.customerEmail,
      lines: input.customerProfile
        ? formatCustomerAddress(input.customerProfile)
        : [input.customerEmail],
      email: input.customerEmail,
    },
    documentVersions: {
      terms: documentVersions?.terms?.versionNumber
        ? `Version ${documentVersions.terms.versionNumber}`
        : null,
      privacy: documentVersions?.privacy?.versionNumber
        ? `Version ${documentVersions.privacy.versionNumber}`
        : null,
      withdrawal: documentVersions?.withdrawal?.versionNumber
        ? `Version ${documentVersions.withdrawal.versionNumber}`
        : null,
    },
    recordedAt: input.recordedAt.toISOString(),
  };
}
