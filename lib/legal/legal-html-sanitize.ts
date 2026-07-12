/**
 * @file legal-html-sanitize.ts
 * @purpose HTML-Bereinigung für externe Rechtstexte (keine Scripts/Tracking).
 */

const BLOCKED_TAG_PATTERN =
  /<\/?(?:script|iframe|object|embed|form|input|button|link|meta|base|svg|math)[^>]*>/gi;

const EVENT_HANDLER_PATTERN = /\s(on\w+|style)\s*=\s*(['"])[^'"]*\2/gi;
const JAVASCRIPT_URL_PATTERN = /\s(href|src|xlink:href)\s*=\s*(['"])\s*javascript:[^'"]*\2/gi;

export function sanitizeLegalHtml(input: string): string {
  let html = input.trim();

  html = html.replace(BLOCKED_TAG_PATTERN, "");
  html = html.replace(EVENT_HANDLER_PATTERN, "");
  html = html.replace(JAVASCRIPT_URL_PATTERN, "");

  return html;
}

export function plainTextToHtml(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return escaped
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br />")}</p>`)
    .join("\n");
}

export function normalizeLegalContent(
  content: string,
  format: "HTML" | "MARKDOWN" | "PLAIN_TEXT",
): string {
  if (format === "PLAIN_TEXT") {
    return plainTextToHtml(content);
  }

  if (format === "MARKDOWN") {
    return plainTextToHtml(content);
  }

  return sanitizeLegalHtml(content);
}
