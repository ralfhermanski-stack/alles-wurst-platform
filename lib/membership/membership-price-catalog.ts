/**
 * @file membership-price-catalog.ts
 * @purpose Kanonische Mitgliedschaftspreise (wie auf der Startseite).
 */

export type MembershipPriceDefinition = {
  productSlug: "wurstclub" | "meisterclub";
  billingPeriod: "monthly" | "yearly";
  grossAmount: number;
};

export const MEMBERSHIP_PRICE_CATALOG: MembershipPriceDefinition[] = [
  { productSlug: "wurstclub", billingPeriod: "monthly", grossAmount: 19.9 },
  { productSlug: "wurstclub", billingPeriod: "yearly", grossAmount: 189 },
  { productSlug: "meisterclub", billingPeriod: "monthly", grossAmount: 49 },
  { productSlug: "meisterclub", billingPeriod: "yearly", grossAmount: 490 },
];

const TAX_RATE = 19;

export function calculateGermanGrossBreakdown(grossAmount: number): {
  netAmount: number;
  taxAmount: number;
  taxRate: number;
} {
  const netAmount = Math.round((grossAmount / (1 + TAX_RATE / 100)) * 100) / 100;
  const taxAmount = Math.round((grossAmount - netAmount) * 100) / 100;

  return {
    netAmount,
    taxAmount,
    taxRate: TAX_RATE,
  };
}
