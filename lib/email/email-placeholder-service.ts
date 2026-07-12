/**
 * @file email-placeholder-service.ts
 */

import { escapeEmailHtml } from "./email-layout";

const DEFAULT_ALLOWED = new Set([
  "publicName",
  "firstName",
  "email",
  "courseName",
  "orderNumber",
  "ticketNumber",
  "withdrawalNumber",
  "privacyRequestNumber",
  "challengeTitle",
  "verificationUrl",
  "resetUrl",
  "accountUrl",
  "supportUrl",
  "documentDownloadUrl",
  "actionUrl",
  "productName",
  "amount",
  "bodyHtml",
]);

export type TemplateVariables = Record<string, string | number | boolean | null | undefined>;

export function getDefaultAllowedVariables(): string[] {
  return [...DEFAULT_ALLOWED].sort();
}

export function buildTestTemplateVariables(
  allowedVariables: string[] = [],
): TemplateVariables {
  const defaults: Record<string, string> = {
    publicName: "Testnutzer",
    firstName: "Test",
    email: "test@example.test",
    courseName: "Test-Kurs",
    orderNumber: "ORD-12345",
    ticketNumber: "TKT-12345",
    withdrawalNumber: "WD-12345",
    privacyRequestNumber: "PRV-12345",
    challengeTitle: "Test-Challenge",
    verificationUrl: "https://example.test/verify",
    resetUrl: "https://example.test/reset",
    accountUrl: "https://example.test/account",
    supportUrl: "https://example.test/support",
    documentDownloadUrl: "https://example.test/download",
    actionUrl: "https://example.test/action",
    productName: "Test-Produkt",
    amount: "29,99 €",
    bodyHtml: "<p>Beispielinhalt für den Testversand.</p>",
  };

  const keys =
    allowedVariables.length > 0 ? allowedVariables : getDefaultAllowedVariables();

  return Object.fromEntries(
    keys.map((key) => [key, defaults[key] ?? `Test-${key}`]),
  );
}

export function resolveTemplateString(
  template: string,
  variables: TemplateVariables,
  allowedVariables: string[],
): string {
  const allowed = new Set(
    allowedVariables.length > 0 ? allowedVariables : getDefaultAllowedVariables(),
  );

  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key: string) => {
    if (!allowed.has(key)) {
      return "";
    }

    const value = variables[key];

    if (value === null || value === undefined) {
      return "";
    }

    if (key === "bodyHtml") {
      return String(value);
    }

    return escapeEmailHtml(String(value));
  });
}

export function findMissingRequiredVariables(
  template: string,
  variables: TemplateVariables,
): string[] {
  const required = [...template.matchAll(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g)].map(
    (match) => match[1],
  );

  return required.filter((key) => {
    const value = variables[key];
    return value === null || value === undefined || String(value).trim() === "";
  });
}
