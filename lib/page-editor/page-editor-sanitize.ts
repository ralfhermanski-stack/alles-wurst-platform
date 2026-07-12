/**
 * @file page-editor-sanitize.ts
 * @purpose Eingabevalidierung und XSS-Schutz für Editor-Inhalte.
 */

const SCRIPT_PATTERN = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const EVENT_HANDLER_PATTERN = /\son\w+\s*=/gi;
const JAVASCRIPT_URL_PATTERN = /javascript:/gi;

export function sanitizePlainPlatformText(value: string): string {
  return value
    .replace(SCRIPT_PATTERN, "")
    .replace(EVENT_HANDLER_PATTERN, "")
    .replace(JAVASCRIPT_URL_PATTERN, "")
    .replace(/<[^>]*>/g, "")
    .trim();
}

export function sanitizeRichPlatformText(value: string): string {
  return value
    .replace(SCRIPT_PATTERN, "")
    .replace(EVENT_HANDLER_PATTERN, "")
    .replace(JAVASCRIPT_URL_PATTERN, "")
    .trim();
}

export function validateTextLength(
  value: string,
  maxLength: number | null | undefined,
): string | null {
  if (maxLength != null && value.length > maxLength) {
    return `Der Text darf maximal ${maxLength} Zeichen lang sein.`;
  }

  return null;
}
