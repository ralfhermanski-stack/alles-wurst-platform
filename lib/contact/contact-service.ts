/**
 * @file contact-service.ts
 * @purpose Kontaktformular: Validierung und Mailversand an Admin + Bestätigung an Absender.
 */

import { getAdminNotificationEmail } from "@/lib/mail/admin-notification-config";
import { sendMail } from "@/lib/mail/mail-service";

export type ContactFormInput = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export type ContactFormResult =
  | { success: true; message: string }
  | { success: false; message: string; fieldErrors?: Record<string, string> };

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/**
 * Validiert und versendet eine Kontaktanfrage.
 */
export async function submitContactForm(
  input: ContactFormInput,
): Promise<ContactFormResult> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const subject = input.subject.trim();
  const message = input.message.trim();

  const fieldErrors: Record<string, string> = {};

  if (name.length < 2) {
    fieldErrors.name = "Bitte gib deinen Namen an (mind. 2 Zeichen).";
  }

  if (!EMAIL_REGEX.test(email)) {
    fieldErrors.email = "Bitte gib eine gültige E-Mail-Adresse an.";
  }

  if (subject.length < 3) {
    fieldErrors.subject = "Bitte gib einen Betreff an.";
  }

  if (message.length < 10) {
    fieldErrors.message = "Bitte schreib eine etwas ausführlichere Nachricht.";
  }

  if (message.length > 5000) {
    fieldErrors.message = "Die Nachricht ist zu lang (max. 5000 Zeichen).";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      success: false,
      message: "Bitte prüfe die markierten Felder.",
      fieldErrors,
    };
  }

  const adminEmail = getAdminNotificationEmail();
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeSubject = escapeHtml(subject);
  const safeMessage = escapeHtml(message).replaceAll("\n", "<br />");

  const adminText = [
    "Neue Kontaktanfrage über alles-wurst.de",
    "",
    `Name: ${name}`,
    `E-Mail: ${email}`,
    `Betreff: ${subject}`,
    "",
    "Nachricht:",
    message,
  ].join("\n");

  const adminHtml = `
    <p><strong>Neue Kontaktanfrage</strong> über alles-wurst.de</p>
    <p>
      <strong>Name:</strong> ${safeName}<br />
      <strong>E-Mail:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a><br />
      <strong>Betreff:</strong> ${safeSubject}
    </p>
    <p><strong>Nachricht:</strong></p>
    <p>${safeMessage}</p>
  `;

  const adminResult = await sendMail({
    to: adminEmail,
    subject: `[Kontakt] ${subject}`,
    text: adminText,
    html: adminHtml,
  });

  if (!adminResult.sent) {
    return {
      success: false,
      message:
        "Die Nachricht konnte gerade nicht gesendet werden. Bitte versuche es später erneut oder schreib an support@alles-wurst.de.",
    };
  }

  // Bestätigung an den Absender (Fehler hier blockieren den Erfolg nicht)
  try {
    await sendMail({
      to: email,
      subject: "Wir haben deine Nachricht erhalten – Alles Wurst",
      text: [
        `Hallo ${name},`,
        "",
        "vielen Dank für deine Nachricht. Wir haben sie erhalten und melden uns in der Regel innerhalb von 24–48 Stunden (Werktage).",
        "",
        `Dein Betreff: ${subject}`,
        "",
        "Viele Grüße",
        "Dein Alles-Wurst-Team",
      ].join("\n"),
      html: `
        <p>Hallo ${safeName},</p>
        <p>vielen Dank für deine Nachricht. Wir haben sie erhalten und melden uns in der Regel innerhalb von <strong>24–48 Stunden</strong> (Werktage).</p>
        <p><strong>Dein Betreff:</strong> ${safeSubject}</p>
        <p>Viele Grüße<br />Dein Alles-Wurst-Team</p>
      `,
    });
  } catch {
    // Absender-Bestätigung ist optional
  }

  return {
    success: true,
    message:
      "Deine Nachricht wurde gesendet. Du erhältst in Kürze eine Bestätigung per E-Mail.",
  };
}
