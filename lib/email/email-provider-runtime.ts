/**
 * @file email-provider-runtime.ts
 * @purpose Provider-Adapter aus DB-Konfiguration oder ENV-Fallback.
 */

import type { MailConfig, SmtpMailConfig } from "@/lib/mail/mail-config";
import { getMailConfig, formatMailFrom } from "@/lib/mail/mail-config";
import { createMailProviderAdapter } from "@/lib/mail/mail-providers/mail-provider-registry";
import type { MailMessage, MailProviderAdapter } from "@/lib/mail/mail-types";

import { decryptEmailCredentialPayload } from "./email-crypto";

import type { EmailProviderConfig, EmailProviderType } from "@prisma/client";

type RuntimeProvider = {
  providerType: EmailProviderType | "dev" | "disabled";
  adapter: MailProviderAdapter | null;
  from: string;
  fromName?: string;
  replyTo?: string;
};

function mapProviderType(type: EmailProviderType): MailConfig["provider"] {
  switch (type) {
    case "SMTP":
      return "smtp";
    case "RESEND":
      return "resend";
    case "BREVO":
      return "brevo";
    case "DEV":
      return "dev";
    case "DISABLED":
      return "disabled";
    default:
      return "disabled";
  }
}

function parseSmtpCredentials(
  encrypted: string | null,
  settings: Record<string, unknown>,
): SmtpMailConfig | undefined {
  const host = String(settings.host ?? process.env.SMTP_HOST ?? "").trim();

  if (!host) {
    return undefined;
  }

  let password = process.env.SMTP_PASS ?? "";

  if (encrypted) {
    try {
      const parsed = JSON.parse(decryptEmailCredentialPayload(encrypted)) as {
        password?: string;
        apiKey?: string;
      };
      password = parsed.password ?? parsed.apiKey ?? password;
    } catch {
      // Fallback auf ENV
    }
  }

  const port = Number.parseInt(String(settings.port ?? process.env.SMTP_PORT ?? "587"), 10);
  const secure =
    String(settings.secure ?? process.env.SMTP_SECURE ?? "false").toLowerCase() ===
    "true";
  const user = String(settings.user ?? process.env.SMTP_USER ?? "").trim();

  return {
    host,
    port: Number.isFinite(port) ? port : 587,
    secure,
    user,
    password,
  };
}

function parseApiKeyCredentials(
  encrypted: string | null,
  envKey: string | undefined,
): string | undefined {
  if (encrypted) {
    try {
      const parsed = JSON.parse(decryptEmailCredentialPayload(encrypted)) as {
        apiKey?: string;
      };

      if (parsed.apiKey?.trim()) {
        return parsed.apiKey.trim();
      }
    } catch {
      // Fallback
    }
  }

  return envKey?.trim() || undefined;
}

export function buildRuntimeProviderFromConfig(
  config: EmailProviderConfig,
  sender?: { displayName: string; emailAddress: string; replyToAddress?: string | null },
): RuntimeProvider {
  const settings = (config.settings ?? {}) as Record<string, unknown>;
  const mapped = mapProviderType(config.providerType);

  const mailConfig: MailConfig = {
    provider: mapped,
    from: sender?.emailAddress ?? process.env.MAIL_FROM?.trim() ?? "noreply@localhost",
    fromName: sender?.displayName ?? process.env.MAIL_FROM_NAME?.trim(),
    smtp:
      mapped === "smtp"
        ? parseSmtpCredentials(config.encryptedCredentials, settings)
        : undefined,
    brevo:
      mapped === "brevo"
        ? {
            apiKey:
              parseApiKeyCredentials(
                config.encryptedCredentials,
                process.env.BREVO_API_KEY,
              ) ?? "",
          }
        : undefined,
    resend:
      mapped === "resend"
        ? {
            apiKey:
              parseApiKeyCredentials(
                config.encryptedCredentials,
                process.env.RESEND_API_KEY,
              ) ?? "",
          }
        : undefined,
  };

  return {
    providerType: config.providerType,
    adapter: createMailProviderAdapter(mailConfig),
    from: mailConfig.from,
    fromName: mailConfig.fromName,
    replyTo: sender?.replyToAddress ?? undefined,
  };
}

export function buildEnvFallbackProvider(sender?: {
  displayName: string;
  emailAddress: string;
  replyToAddress?: string | null;
}): RuntimeProvider {
  const config = getMailConfig();

  return {
    providerType:
      config.provider === "dev"
        ? "DEV"
        : config.provider === "disabled"
          ? "DISABLED"
          : config.provider.toUpperCase() as EmailProviderType,
    adapter: createMailProviderAdapter(config),
    from: sender?.emailAddress ?? config.from,
    fromName: sender?.displayName ?? config.fromName,
    replyTo: sender?.replyToAddress ?? undefined,
  };
}

export async function sendViaRuntimeProvider(input: {
  runtime: RuntimeProvider;
  message: MailMessage;
}): Promise<{ sent: boolean; providerMessageId?: string }> {
  if (input.runtime.providerType === "DEV") {
    console.info("[email:dev] E-Mail (Entwicklungsmodus)");
    console.info(`  An:      ${input.message.to}`);
    console.info(`  Betreff: ${input.message.subject}`);
    if (input.message.actionLink) {
      console.info(`  Link:    ${input.message.actionLink}`);
    }
    console.info(`  Text:\n${input.message.text}`);
    return { sent: false };
  }

  if (!input.runtime.adapter) {
    console.warn("[email] Kein Provider-Adapter verfügbar.");
    return { sent: false };
  }

  await input.runtime.adapter.send(input.message, {
    from: formatMailFrom({
      provider: "smtp",
      from: input.runtime.from,
      fromName: input.runtime.fromName,
    }),
    fromName: input.runtime.fromName,
  });

  return { sent: true };
}
