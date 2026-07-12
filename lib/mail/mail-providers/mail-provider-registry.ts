/**
 * @file mail-provider-registry.ts
 * @purpose Wählt den konfigurierten Mail-Provider-Adapter.
 */

import type { MailConfig } from "../mail-config";
import type { MailProviderAdapter } from "../mail-types";
import { MailDeliveryError } from "../mail-types";

import { createBrevoProvider } from "./brevo-provider";
import { createResendProvider } from "./resend-provider";
import { createSmtpProvider } from "./smtp-provider";

export function createMailProviderAdapter(
  config: MailConfig,
): MailProviderAdapter | null {
  switch (config.provider) {
    case "smtp":
      return createSmtpProvider(config);
    case "brevo":
      return createBrevoProvider(config);
    case "resend":
      return createResendProvider(config);
    case "dev":
    case "disabled":
      return null;
    default: {
      const exhaustive: never = config.provider;
      throw new MailDeliveryError("disabled", `Unbekannter Provider: ${exhaustive}`);
    }
  }
}
