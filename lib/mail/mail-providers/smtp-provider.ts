/**
 * @file smtp-provider.ts
 * @purpose SMTP-Versand über nodemailer.
 */

import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

import type { MailConfig } from "../mail-config";
import type {
  MailDeliveryContext,
  MailMessage,
  MailProviderAdapter,
} from "../mail-types";
import { MailDeliveryError } from "../mail-types";

function createSmtpTransporter(config: MailConfig): Transporter {
  if (!config.smtp) {
    throw new MailDeliveryError(
      "smtp",
      "SMTP-Konfiguration fehlt (SMTP_HOST erforderlich).",
    );
  }

  return nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth:
      config.smtp.user && config.smtp.password
        ? {
            user: config.smtp.user,
            pass: config.smtp.password,
          }
        : undefined,
  });
}

export function createSmtpProvider(config: MailConfig): MailProviderAdapter {
  const transporter = createSmtpTransporter(config);

  return {
    id: "smtp",
    async send(message: MailMessage, context: MailDeliveryContext): Promise<void> {
      try {
        await transporter.sendMail({
          from: context.from,
          to: message.to,
          subject: message.subject,
          text: message.text,
          html: message.html,
        });
      } catch (error) {
        const detail =
          error instanceof Error ? error.message : "Unbekannter SMTP-Fehler";

        throw new MailDeliveryError("smtp", detail);
      }
    },
  };
}
