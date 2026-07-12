/**
 * @file build-system-mails.ts
 * @purpose Async E-Mail-Builder mit DB-Texten.
 */

import { getPlatformText } from "@/lib/platform-text/platform-text-service";
import type { MailMessage } from "./mail-types";
import {
  buildEmailVerificationMail as buildEmailVerificationMailSync,
  buildPasswordResetMail as buildPasswordResetMailSync,
} from "./system-mail-templates";

export async function buildEmailVerificationMail(
  actionLink: string,
): Promise<MailMessage> {
  const [subject, intro, button, expiry] = await Promise.all([
    getPlatformText("emails.verify.subject", "E-Mail-Adresse bestätigen — Alles Wurst"),
    getPlatformText(
      "emails.verify.intro",
      "bitte bestätige deine E-Mail-Adresse für dein Alles-Wurst-Konto:",
    ),
    getPlatformText("emails.verify.button", "E-Mail bestätigen"),
    getPlatformText("emails.verify.expiry", "Der Link ist 24 Stunden gültig."),
  ]);

  const base = buildEmailVerificationMailSync(actionLink);

  return {
    ...base,
    subject,
    text: [
      "Hallo,",
      "",
      intro,
      actionLink,
      "",
      expiry,
      "",
      "Falls du dich nicht registriert hast, kannst du diese E-Mail ignorieren.",
      "",
      "— Alles Wurst",
    ].join("\n"),
    html: base.html.replace("E-Mail bestätigen", button).replace(
      "bitte bestätige deine E-Mail-Adresse für dein Alles-Wurst-Konto.",
      intro.endsWith(":") ? intro.slice(0, -1) + "." : intro,
    ),
  };
}

export async function buildPasswordResetMail(
  actionLink: string,
): Promise<MailMessage> {
  const [subject, intro, button] = await Promise.all([
    getPlatformText("emails.reset.subject", "Passwort zurücksetzen — Alles Wurst"),
    getPlatformText(
      "emails.reset.intro",
      "du hast ein neues Passwort für dein Alles-Wurst-Konto angefordert:",
    ),
    getPlatformText("emails.reset.button", "Passwort zurücksetzen"),
  ]);

  const base = buildPasswordResetMailSync(actionLink);

  return {
    ...base,
    subject,
    text: [
      "Hallo,",
      "",
      intro,
      actionLink,
      "",
      "Der Link ist 1 Stunde gültig.",
      "",
      "Falls du das nicht warst, kannst du diese E-Mail ignorieren.",
      "",
      "— Alles Wurst",
    ].join("\n"),
    html: base.html.replace("Passwort zurücksetzen", button),
  };
}
