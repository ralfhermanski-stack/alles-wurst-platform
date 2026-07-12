/**
 * @file system-mail-templates.ts
 * @purpose Deutsche HTML- und Text-Vorlagen für System-Mails.
 */

import type { MailMessage } from "./mail-types";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function wrapSystemMailHtml(content: string): string {
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Alles Wurst</title>
</head>
<body style="margin:0;padding:0;background-color:#1a1410;font-family:Georgia,'Times New Roman',serif;color:#f5e6d3;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#1a1410;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#2a2118;border:1px solid #c9a227;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:28px 32px 8px;font-size:22px;font-weight:bold;color:#f5e6d3;">
              Alles Wurst
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 32px;font-size:16px;line-height:1.6;color:#d4c4b0;">
              ${content}
            </td>
          </tr>
        </table>
        <p style="margin:20px 0 0;font-size:12px;color:#8a7a68;text-align:center;">
          Diese Systemnachricht wurde automatisch versendet. Bitte nicht antworten.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function actionButtonHtml(label: string, href: string): string {
  const safeHref = escapeHtml(href);
  const safeLabel = escapeHtml(label);

  return `<p style="margin:28px 0;">
  <a href="${safeHref}" style="display:inline-block;padding:12px 20px;background-color:#c9a227;color:#1a1410;text-decoration:none;font-weight:bold;border-radius:8px;">
    ${safeLabel}
  </a>
</p>
<p style="margin:0;font-size:14px;color:#8a7a68;word-break:break-all;">
  Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:<br />
  <a href="${safeHref}" style="color:#c9a227;">${safeHref}</a>
</p>`;
}

/**
 * E-Mail zur Adressbestätigung nach Registrierung oder auf Anfrage.
 */
export function buildEmailVerificationMail(actionLink: string): MailMessage {
  const subject = "E-Mail-Adresse bestätigen — Alles Wurst";

  const text = [
    "Hallo,",
    "",
    "bitte bestätige deine E-Mail-Adresse für dein Alles-Wurst-Konto:",
    actionLink,
    "",
    "Der Link ist 24 Stunden gültig.",
    "",
    "Falls du dich nicht registriert hast, kannst du diese E-Mail ignorieren.",
    "",
    "— Alles Wurst",
  ].join("\n");

  const html = wrapSystemMailHtml(`
    <p style="margin:0 0 16px;">Hallo,</p>
    <p style="margin:0 0 16px;">
      bitte bestätige deine E-Mail-Adresse für dein Alles-Wurst-Konto.
    </p>
    ${actionButtonHtml("E-Mail bestätigen", actionLink)}
    <p style="margin:24px 0 0;font-size:14px;color:#8a7a68;">
      Der Link ist 24 Stunden gültig.
    </p>
    <p style="margin:16px 0 0;font-size:14px;color:#8a7a68;">
      Falls du dich nicht registriert hast, kannst du diese E-Mail ignorieren.
    </p>
  `);

  return {
    to: "",
    subject,
    text,
    html,
    actionLink,
  };
}

/**
 * E-Mail zum Zurücksetzen des Passworts.
 */
export function buildPasswordResetMail(actionLink: string): MailMessage {
  const subject = "Passwort zurücksetzen — Alles Wurst";

  const text = [
    "Hallo,",
    "",
    "du hast ein neues Passwort für dein Alles-Wurst-Konto angefordert:",
    actionLink,
    "",
    "Der Link ist 1 Stunde gültig.",
    "",
    "Falls du das nicht warst, kannst du diese E-Mail ignorieren.",
    "",
    "— Alles Wurst",
  ].join("\n");

  const html = wrapSystemMailHtml(`
    <p style="margin:0 0 16px;">Hallo,</p>
    <p style="margin:0 0 16px;">
      du hast ein neues Passwort für dein Alles-Wurst-Konto angefordert.
    </p>
    ${actionButtonHtml("Passwort zurücksetzen", actionLink)}
    <p style="margin:24px 0 0;font-size:14px;color:#8a7a68;">
      Der Link ist 1 Stunde gültig.
    </p>
    <p style="margin:16px 0 0;font-size:14px;color:#8a7a68;">
      Falls du das nicht warst, kannst du diese E-Mail ignorieren.
    </p>
  `);

  return {
    to: "",
    subject,
    text,
    html,
    actionLink,
  };
}
