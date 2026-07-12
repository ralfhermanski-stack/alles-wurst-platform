/**
 * @file mail-types.ts
 * @purpose Typen für den Mail-Service und Provider-Adapter.
 */

export type MailProviderId = "dev" | "smtp" | "brevo" | "resend" | "disabled";

export type MailMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
  /** Optionaler Aktionslink für Dev-UI (wird nicht in der E-Mail extra gesendet) */
  actionLink?: string;
};

export type MailSendResult = {
  sent: boolean;
  /** Nur im Entwicklungsmodus: direkter Aktionslink für UI/Log */
  devActionLink?: string;
};

export type MailDeliveryContext = {
  from: string;
  fromName?: string;
};

export type MailProviderAdapter = {
  id: MailProviderId;
  send: (message: MailMessage, context: MailDeliveryContext) => Promise<void>;
};

export class MailDeliveryError extends Error {
  readonly provider: MailProviderId;
  readonly causeDetail: string;

  constructor(provider: MailProviderId, causeDetail: string) {
    super(`Mailversand über ${provider} fehlgeschlagen.`);
    this.name = "MailDeliveryError";
    this.provider = provider;
    this.causeDetail = causeDetail;
  }
}
