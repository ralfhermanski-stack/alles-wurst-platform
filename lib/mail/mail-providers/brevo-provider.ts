/**
 * @file brevo-provider.ts
 * @purpose Brevo (Sendinblue) API — vorbereitet, aktivierbar über MAIL_PROVIDER=brevo.
 */

import type { MailConfig } from "../mail-config";
import type {
  MailDeliveryContext,
  MailMessage,
  MailProviderAdapter,
} from "../mail-types";
import { MailDeliveryError } from "../mail-types";

type BrevoSendResponse = {
  messageId?: string;
};

export function createBrevoProvider(config: MailConfig): MailProviderAdapter {
  return {
    id: "brevo",
    async send(message: MailMessage, context: MailDeliveryContext): Promise<void> {
      void context;
      if (!config.brevo?.apiKey) {
        throw new MailDeliveryError(
          "brevo",
          "BREVO_API_KEY fehlt in der Umgebungskonfiguration.",
        );
      }

      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": config.brevo.apiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          sender: {
            email: config.from,
            name: config.fromName,
          },
          to: [{ email: message.to }],
          subject: message.subject,
          textContent: message.text,
          htmlContent: message.html,
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new MailDeliveryError(
          "brevo",
          `HTTP ${response.status}: ${body.slice(0, 200)}`,
        );
      }

      const payload = (await response.json()) as BrevoSendResponse;

      if (!payload.messageId) {
        throw new MailDeliveryError("brevo", "Antwort ohne messageId.");
      }
    },
  };
}
