/**
 * @file platform-review-sanitize.ts
 */

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export function sanitizePlatformReviewTitle(value: string): string {
  return value.replace(CONTROL_CHARS, "").trim().slice(0, 100);
}

export function sanitizePlatformReviewContent(value: string): string {
  return value
    .replace(CONTROL_CHARS, "")
    .replace(/<[^>]*>/g, "")
    .trim()
    .slice(0, 1500);
}

export function validatePlatformReviewContent(value: string): string | null {
  const sanitized = sanitizePlatformReviewContent(value);

  if (sanitized.length < 30) {
    return "Der Bewertungstext muss mindestens 30 Zeichen lang sein.";
  }

  return null;
}
