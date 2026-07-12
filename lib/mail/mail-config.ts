/**
 * @file mail-config.ts
 * @purpose ENV-Konfiguration für System-Mails.
 */

import type { MailProviderId } from "./mail-types";

export type SmtpMailConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
};

export type BrevoMailConfig = {
  apiKey: string;
};

export type ResendMailConfig = {
  apiKey: string;
};

export type MailConfig = {
  provider: MailProviderId;
  from: string;
  fromName?: string;
  smtp?: SmtpMailConfig;
  brevo?: BrevoMailConfig;
  resend?: ResendMailConfig;
};

function parseProvider(value: string | undefined): MailProviderId | null {
  const normalized = value?.trim().toLowerCase();

  if (
    normalized === "dev" ||
    normalized === "smtp" ||
    normalized === "brevo" ||
    normalized === "resend" ||
    normalized === "disabled"
  ) {
    return normalized;
  }

  return null;
}

function resolveProvider(): MailProviderId {
  const configured = parseProvider(process.env.MAIL_PROVIDER);

  if (configured) {
    return configured;
  }

  if (process.env.NODE_ENV === "development") {
    return "dev";
  }

  return "disabled";
}

function readSmtpConfig(): SmtpMailConfig | undefined {
  const host = process.env.SMTP_HOST?.trim();

  if (!host) {
    return undefined;
  }

  const port = Number.parseInt(process.env.SMTP_PORT ?? "587", 10);
  const secure = process.env.SMTP_SECURE?.trim().toLowerCase() === "true";
  const user = process.env.SMTP_USER?.trim() ?? "";
  const password = process.env.SMTP_PASS ?? "";

  if (!Number.isFinite(port) || port <= 0) {
    throw new Error("SMTP_PORT muss eine positive Zahl sein.");
  }

  return {
    host,
    port,
    secure,
    user,
    password,
  };
}

function readBrevoConfig(): BrevoMailConfig | undefined {
  const apiKey = process.env.BREVO_API_KEY?.trim();

  if (!apiKey) {
    return undefined;
  }

  return { apiKey };
}

function readResendConfig(): ResendMailConfig | undefined {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    return undefined;
  }

  return { apiKey };
}

/**
 * Liest die Mail-Konfiguration aus den Umgebungsvariablen.
 */
export function getMailConfig(): MailConfig {
  const from = process.env.MAIL_FROM?.trim();

  if (!from) {
    throw new Error("MAIL_FROM ist erforderlich.");
  }

  const fromName = process.env.MAIL_FROM_NAME?.trim() || undefined;

  return {
    provider: resolveProvider(),
    from,
    fromName,
    smtp: readSmtpConfig(),
    brevo: readBrevoConfig(),
    resend: readResendConfig(),
  };
}

/**
 * Liefert den konfigurierten Absender (mit optionalem Anzeigenamen).
 */
export function formatMailFrom(config: MailConfig): string {
  if (config.fromName) {
    return `"${config.fromName}" <${config.from}>`;
  }

  return config.from;
}
