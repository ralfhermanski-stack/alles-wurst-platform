/**
 * @file legal-consent-texts.ts
 * @purpose Technische Platzhalter — vor Produktivbetrieb rechtlich prüfen lassen.
 */

export type CheckoutConsentTextSet = {
  immediateAccess: string;
  withdrawalLoss: string;
  termsPrefix: string;
  privacyPrefix: string;
};

export const CHECKOUT_CONSENT_TEXTS_V1: CheckoutConsentTextSet = {
  immediateAccess:
    "Ich verlange ausdrücklich, dass Alles Wurst vor Ablauf der Widerrufsfrist mit der Bereitstellung der digitalen Inhalte beginnt.",
  withdrawalLoss:
    "Mir ist bekannt, dass ich durch meine Zustimmung mit Beginn der Bereitstellung der digitalen Inhalte mein Widerrufsrecht verliere.",
  termsPrefix: "Ich habe die Allgemeinen Geschäftsbedingungen gelesen und akzeptiere sie.",
  privacyPrefix:
    "Ich habe die Datenschutzerklärung zur Kenntnis genommen.",
};

export const CHECKOUT_CONSENT_VERSION = "checkout-consent-v1";
