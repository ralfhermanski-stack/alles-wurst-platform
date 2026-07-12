/**
 * @file contract-product-benefits.ts
 * @purpose Leistungsumfang je Produkt für Vertragsbestätigung.
 */

import type { BillingPeriod, ProductKind } from "@prisma/client";

const MEISTERCLUB_BENEFITS: Record<BillingPeriod, string[]> = {
  monthly: [
    "Zugriff auf alle Meisterclub-Inhalte",
    "Exklusive Meisterclub-Foren",
    "Workshops und Fragerunden",
    "Premium-Werkzeuge",
    "Rezeptentwicklung",
    "Exklusive Schulungsinhalte",
  ],
  yearly: [
    "Alle Vorteile der Meisterclub-Mitgliedschaft",
    "Zugriff auf alle Meisterclub-Inhalte",
    "Exklusive Meisterclub-Foren",
    "Workshops und Fragerunden",
    "Premium-Werkzeuge und Rezeptersteller",
    "Freischaltung des kompletten Grundkurses",
  ],
  one_time: [
    "Zugriff auf alle Meisterclub-Inhalte",
    "Exklusive Meisterclub-Foren",
    "Workshops und Fragerunden",
    "Premium-Werkzeuge",
    "Rezeptentwicklung",
  ],
};

const WURSTCLUB_BENEFITS: Record<BillingPeriod, string[]> = {
  monthly: [
    "Zugang zum Community-Forum",
    "Austausch mit Gleichgesinnten",
    "Rezept des Monats",
    "Voller Zugriff auf den Salzrechner",
    "Monatliches Zoom-Meeting mit dem Fleischermeister",
  ],
  yearly: [
    "Alle Vorteile des Wurst Clubs",
    "Voller Zugriff auf den Lakerechner",
    "Zugriff auf das Rezept-des-Monats-Archiv",
    "Freischaltung des Schnupperkurses",
    "Teilnahme an Community-Aktionen und Challenges",
  ],
  one_time: [
    "Zugang zum Community-Forum",
    "Exklusive Mitgliederinhalte",
  ],
};

export function resolveContractBenefits(input: {
  productSlug: string;
  productKind: ProductKind;
  billingPeriod: BillingPeriod;
  productDescription?: string | null;
}): string[] {
  if (input.productSlug === "meisterclub") {
    return (
      MEISTERCLUB_BENEFITS[input.billingPeriod] ??
      MEISTERCLUB_BENEFITS.monthly
    );
  }

  if (input.productSlug === "wurstclub") {
    return (
      WURSTCLUB_BENEFITS[input.billingPeriod] ?? WURSTCLUB_BENEFITS.monthly
    );
  }

  if (input.productDescription?.trim()) {
    return input.productDescription
      .split(/\n|•|·/)
      .map((line) => line.trim())
      .filter(Boolean);
  }

  if (
    input.productKind === "course" ||
    input.productKind === "workshop"
  ) {
    return [
      "Zugriff auf alle Kursinhalte des erworbenen Produkts",
      "Teilnahme an zugehörigen Foren und Community-Bereichen",
      "Nutzung der enthaltenen Werkzeuge und Materialien",
    ];
  }

  return ["Leistungen gemäß Produktbeschreibung zum Kaufzeitpunkt"];
}

export function formatBillingPeriodLabel(period: BillingPeriod): string {
  switch (period) {
    case "monthly":
      return "Monatlich";
    case "yearly":
      return "Jährlich";
    case "one_time":
      return "Einmalig";
    default: {
      const exhaustive: never = period;
      return exhaustive;
    }
  }
}

export function formatRenewalConditions(input: {
  billingPeriod: BillingPeriod;
  productKind: ProductKind;
}): string {
  const isMembership =
    input.productKind === "membership_wurstclub" ||
    input.productKind === "membership_meisterclub";

  if (!isMembership) {
    return "Keine automatische Verlängerung — Zugang gemäß erworbener Laufzeit.";
  }

  if (input.billingPeriod === "monthly") {
    return "Monatliche automatische Verlängerung, sofern nicht zum Periodenende gekündigt. Kündigung jederzeit zum Ende der laufenden Abrechnungsperiode möglich.";
  }

  if (input.billingPeriod === "yearly") {
    return "Jährliche automatische Verlängerung, sofern nicht zum Periodenende gekündigt. Kündigung jederzeit zum Ende der laufenden Abrechnungsperiode möglich.";
  }

  return "Keine automatische Verlängerung.";
}
