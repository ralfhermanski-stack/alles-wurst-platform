/**
 * @file resend-provider.ts
 * @purpose Resend API — vorbereitet, aktivierbar über MAIL_PROVIDER=resend.
 */

import type { MailConfig } from "../mail-config";
import type {
  MailDeliveryContext,
  MailMessage,
  MailProviderAdapter,
} from "../mail-types";
import { MailDeliveryError } from "../mail-types";

type ResendSendResponse = {
  id?: string;
  message?: string;
};

export function createResendProvider(config: MailConfig): MailProviderAdapter {
  return {
    id: "resend",
    async send(message: MailMessage, context: MailDeliveryContext): Promise<void> {
      if (!config.resend?.apiKey) {
        throw new MailDeliveryError(
          "resend",
          "RESEND_API_KEY fehlt in der Umgebungskonfiguration.",
        );
      }

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.resend.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: context.from,
          to: [message.to],
          subject: message.subject,
          text: message.text,
          html: message.html,
        }),
      });

      const payload = (await response.json()) as ResendSendResponse;

      if (!response.ok) {
        throw new MailDeliveryError(
          "resend",
          `HTTP ${response.status}: ${payload.message ?? "Unbekannter Fehler"}`,
        );
      }

      if (!payload.id) {
        throw new MailDeliveryError("resend", "Antwort ohne id.");
      }
    },
  };
}
