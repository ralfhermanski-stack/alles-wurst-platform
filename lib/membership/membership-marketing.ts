/**
 * @file membership-marketing.ts
 * @purpose Marketing-Darstellung der verkaufbaren Mitgliedschaften aus dem DB-Katalog.
 */

import type { BillingPeriod } from "@prisma/client";

import { formatMoney } from "@/lib/payments/format-money";
import { listActiveProducts } from "@/lib/payments/product-catalog-service";
import type { ProductWithPrices } from "@/lib/payments/payment-types";
import type { Membership, MembershipTier } from "@/lib/placeholder-data";

type MarketingTemplate = Omit<
  Membership,
  "slug" | "name" | "price" | "period" | "priceNote" | "savings"
>;

const MARKETING_TEMPLATES: Record<
  string,
  Record<BillingPeriod, MarketingTemplate>
> = {
  wurstclub: {
    monthly: {
      tier: "bronze",
      tagline:
        "Dein Einstieg in die Welt des Wursthandwerks. Lerne die Grundlagen, tausche dich aus und starte deine ersten Kurse.",
      features: [
        { icon: "chat", label: "Zugang zum Community-Forum" },
        { icon: "users", label: "Austausch mit Gleichgesinnten" },
        { icon: "recipe", label: "Rezept des Monats" },
        { icon: "salt", label: "Voller Zugriff auf den Salzrechner" },
        { icon: "video", label: "Monatliches Zoom-Meeting mit dem Fleischermeister" },
        { icon: "spark", label: "Exklusive Mitgliederinhalte" },
      ],
      cta: "Jetzt per Stripe kaufen",
    },
    yearly: {
      tier: "silver",
      tagline:
        "Mehr Wissen, mehr Praxis, mehr Ergebnisse. Für alle, die das Wursten ernsthaft lernen und kontinuierlich besser werden wollen.",
      popular: true,
      features: [
        { icon: "check", label: "Alle Vorteile des Wurst Clubs" },
        {
          icon: "coin",
          label: "Deutlicher Preisvorteil gegenüber dem Monatsabo",
          highlight: true,
        },
        { icon: "brine", label: "Voller Zugriff auf den Lakerechner" },
        { icon: "book", label: "Zugriff auf das komplette Rezept-des-Monats-Archiv" },
        { icon: "unlock", label: "Freischaltung des Schnupperkurses" },
        { icon: "flag", label: "Teilnahme an Community-Aktionen und Challenges" },
        { icon: "clock", label: "Frühzeitiger Zugang zu neuen Inhalten" },
      ],
      cta: "Jahresabo per Stripe kaufen",
    },
    one_time: {
      tier: "bronze",
      tagline: "Wurstclub-Mitgliedschaft",
      features: [],
      cta: "Jetzt kaufen",
    },
  },
  meisterclub: {
    monthly: {
      tier: "gold",
      tagline:
        "Der Meisterclub ist die Spitze des Wurst Clubs. Hier geht es um echtes Handwerk, eigene Rezeptentwicklung und den direkten Austausch mit dem Fleischermeister.",
      features: [
        { icon: "crown", label: "Alle Vorteile des Wurst Club Pro" },
        { icon: "video", label: "Zugang zu exklusiven Live-Q&As und Workshops" },
        { icon: "handshake", label: "Direkter Austausch mit dem Fleischermeister" },
        { icon: "salt", label: "Unterstützung bei der Entwicklung eigener Rezepte" },
        { icon: "book", label: "Zugriff auf den Rezeptersteller mit PDF-Ausgabe" },
        { icon: "ticket", label: "Zugang zu ausgewählten Live-Events" },
        { icon: "search", label: "Individuelle Rezeptprüfung auf Wunsch" },
      ],
      cta: "Jetzt per Stripe kaufen",
    },
    yearly: {
      tier: "gold-premium",
      tagline:
        "Das Komplettpaket für alle, die ihr Handwerk auf das nächste Level bringen wollen.",
      featured: true,
      features: [
        { icon: "crown", label: "Alle Vorteile der Meisterklasse Wurst Club" },
        {
          icon: "coin",
          label: "Großer Preisvorteil gegenüber dem Monatsabo",
          highlight: true,
        },
        { icon: "salt", label: "Unterstützung bei der Entwicklung eigener Rezepte" },
        { icon: "book", label: "Zugriff auf den Rezeptersteller mit PDF-Ausgabe" },
        { icon: "ticket", label: "Zugang zu ausgewählten Live-Events" },
        { icon: "search", label: "Individuelle Rezeptprüfung auf Wunsch" },
        { icon: "cap", label: "Freischaltung des kompletten Grundkurses" },
      ],
      cta: "Jahresabo per Stripe kaufen",
    },
    one_time: {
      tier: "gold",
      tagline: "Meisterclub-Mitgliedschaft",
      features: [],
      cta: "Jetzt kaufen",
    },
  },
};

export type MembershipMarketingPlan = Membership & {
  productSlug: string;
  priceId: string;
  checkoutHref: string;
  billingPeriod: BillingPeriod;
};

function isMembershipProduct(product: ProductWithPrices): boolean {
  return (
    product.kind === "membership_wurstclub" ||
    product.kind === "membership_meisterclub"
  );
}

function formatPeriodLabel(billingPeriod: BillingPeriod): string {
  if (billingPeriod === "monthly") {
    return "pro Monat";
  }

  if (billingPeriod === "yearly") {
    return "pro Jahr";
  }

  return "einmalig";
}

function formatMonthlyEquivalent(yearlyAmount: number, currency: string): string {
  const monthly = yearlyAmount / 12;
  return `entspricht ${formatMoney(monthly, currency)} / Monat`;
}

function formatSavings(
  monthlyAmount: number,
  yearlyAmount: number,
  currency: string,
): string {
  const savings = monthlyAmount * 12 - yearlyAmount;

  if (savings <= 0) {
    return "";
  }

  return `Spare ${formatMoney(savings, currency)} gegenüber dem Monatsabo`;
}

function buildPlanName(product: ProductWithPrices, billingPeriod: BillingPeriod): string {
  if (product.slug === "wurstclub") {
    return billingPeriod === "yearly" ? "Wurst Club Pro" : "Wurst Club";
  }

  if (product.slug === "meisterclub") {
    return billingPeriod === "yearly"
      ? "Meisterklasse Wurst Club Pro"
      : "Meisterklasse Wurst Club";
  }

  return product.name;
}

function buildPlanSlug(product: ProductWithPrices, billingPeriod: BillingPeriod): string {
  return `${product.slug}-${billingPeriod}`;
}

function buildMarketingPlan(
  product: ProductWithPrices,
  billingPeriod: BillingPeriod,
): MembershipMarketingPlan | null {
  const price = product.prices.find((entry) => entry.billingPeriod === billingPeriod);

  if (!price) {
    return null;
  }

  const template =
    MARKETING_TEMPLATES[product.slug]?.[billingPeriod] ??
    MARKETING_TEMPLATES[product.slug]?.monthly;

  if (!template) {
    return null;
  }

  const monthlyPrice = product.prices.find((entry) => entry.billingPeriod === "monthly");
  const savings =
    billingPeriod === "yearly" && monthlyPrice
      ? formatSavings(
          monthlyPrice.grossAmount,
          price.grossAmount,
          price.currency,
        )
      : undefined;

  return {
    slug: buildPlanSlug(product, billingPeriod),
    productSlug: product.slug,
    priceId: price.id,
    billingPeriod,
    checkoutHref: `/kaufen/${product.slug}?period=${billingPeriod}`,
    name: buildPlanName(product, billingPeriod),
    tier: template.tier as MembershipTier,
    price: formatMoney(price.grossAmount, price.currency),
    period: formatPeriodLabel(billingPeriod),
    priceNote:
      billingPeriod === "yearly"
        ? formatMonthlyEquivalent(price.grossAmount, price.currency)
        : undefined,
    savings: savings || undefined,
    tagline: template.tagline,
    features: template.features,
    cta: template.cta,
    popular: template.popular,
    featured: template.featured,
  };
}

/**
 * Lädt verkaufbare Mitgliedschaftspläne für die Marketing-Seite.
 */
export async function listMembershipMarketingPlans(): Promise<{
  plans: MembershipMarketingPlan[];
  error: string | null;
}> {
  const result = await listActiveProducts();

  if (!result.success) {
    return {
      plans: [],
      error: result.error.message,
    };
  }

  const membershipProducts = result.data
    .filter(isMembershipProduct)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const plans: MembershipMarketingPlan[] = [];

  for (const product of membershipProducts) {
    for (const billingPeriod of ["monthly", "yearly"] as const) {
      const plan = buildMarketingPlan(product, billingPeriod);

      if (plan) {
        plans.push(plan);
      }
    }
  }

  return { plans, error: null };
}
