/**
 * @file email-layout.ts
 * @purpose Zentrales E-Mail-Layout für Alles Wurst.
 */

import { buildAppUrl } from "@/lib/mail/mail-service";

export function escapeEmailHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function actionButtonHtml(label: string, href: string): string {
  const safeHref = escapeEmailHtml(href);
  const safeLabel = escapeEmailHtml(label);

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

export function wrapPlatformEmailHtml(input: {
  content: string;
  senderName?: string;
  preheader?: string;
  showUnsubscribe?: boolean;
  unsubscribeUrl?: string;
  automatedNotice?: boolean;
}): string {
  const sender = escapeEmailHtml(input.senderName ?? "Alles Wurst");
  const preheader = input.preheader
    ? `<span style="display:none;max-height:0;overflow:hidden;">${escapeEmailHtml(input.preheader)}</span>`
    : "";

  const footerLinks = [
    `<a href="${buildAppUrl("/impressum")}" style="color:#c9a227;">Impressum</a>`,
    `<a href="${buildAppUrl("/datenschutz")}" style="color:#c9a227;">Datenschutz</a>`,
  ];

  if (input.showUnsubscribe && input.unsubscribeUrl) {
    footerLinks.push(
      `<a href="${escapeEmailHtml(input.unsubscribeUrl)}" style="color:#c9a227;">Abmelden</a>`,
    );
  }

  const automated = input.automatedNotice === false
    ? ""
    : `<p style="margin:12px 0 0;font-size:12px;color:#8a7a68;text-align:center;">
        Diese Nachricht wurde automatisch versendet.
      </p>`;

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${sender}</title>
</head>
<body style="margin:0;padding:0;background-color:#1a1410;font-family:Georgia,'Times New Roman',serif;color:#f5e6d3;">
  ${preheader}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#1a1410;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#2a2118;border:1px solid #c9a227;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:28px 32px 8px;font-size:22px;font-weight:bold;color:#f5e6d3;">
              ${sender}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 32px;font-size:16px;line-height:1.6;color:#d4c4b0;">
              ${input.content}
            </td>
          </tr>
        </table>
        <p style="margin:20px 0 0;font-size:12px;color:#8a7a68;text-align:center;">
          ${footerLinks.join(" · ")}
        </p>
        ${automated}
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .trim();
}
