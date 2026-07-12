/**
 * @file legal-consent-texts.ts
 * @purpose Rechtliche Zustimmungstexte für Checkout und Vertragsnachweise.
 * Vor Produktivbetrieb rechtlich prüfen lassen.
 */

export type CheckoutConsentTextSet = {
  immediateAccess: string;
  withdrawalLoss: string;
  termsPrefix: string;
  privacyPrefix: string;
};

export const CHECKOUT_CONSENT_TEXTS_V2: CheckoutConsentTextSet = {
  immediateAccess:
    "Ich verlange ausdrücklich, dass ALLES WURST bereits vor Ablauf der gesetzlichen Widerrufsfrist mit der Bereitstellung der digitalen Inhalte und Dienstleistungen beginnt.",
  withdrawalLoss:
    "Mir ist bekannt, dass ich bei vollständiger Vertragserfüllung mein gesetzliches Widerrufsrecht ganz oder teilweise verlieren kann.",
  termsPrefix:
    "Ich habe die Allgemeinen Geschäftsbedingungen gelesen und akzeptiere sie.",
  privacyPrefix:
    "Ich habe die Datenschutzerklärung zur Kenntnis genommen.",
};

/** @deprecated Nutze CHECKOUT_CONSENT_TEXTS_V2 */
export const CHECKOUT_CONSENT_TEXTS_V1 = CHECKOUT_CONSENT_TEXTS_V2;

export const CHECKOUT_CONSENT_VERSION = "checkout-consent-v2";

export const FORUM_RULES_CONSENT_TEXT =
  "Ich habe die Forenregeln gelesen und akzeptiere sie. Mir ist bekannt, dass ich vor jedem Beitrag im Forum eine gültige Zustimmung benötige und diese alle drei Monate erneuert werden muss.";

export const FORUM_RULES_ACCEPTANCE_TYPE = "FORUM_RULES";

/** Gültigkeitsdauer der Forenregeln-Zustimmung (Vierteljahr). */
export const FORUM_RULES_ACCEPTANCE_VALIDITY_DAYS = 90;

export function immediateAccessStatusLabel(consented: boolean): string {
  return consented
    ? "Sofortige Bereitstellung zugestimmt"
    : "Sofortige Bereitstellung nicht zugestimmt";
}

export function withdrawalLossStatusLabel(acknowledged: boolean): string {
  return acknowledged
    ? "Widerrufsbelehrung bestätigt"
    : "Widerrufsverlust nicht bestätigt";
}
