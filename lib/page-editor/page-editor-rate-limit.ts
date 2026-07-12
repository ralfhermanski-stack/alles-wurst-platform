/**
 * @file page-editor-rate-limit.ts
 * @purpose Einfaches Rate-Limiting für Schreibzugriffe im Seiteneditor.
 */

const WRITE_WINDOW_MS = 60_000;
const WRITE_MAX_PER_WINDOW = 60;

const buckets = new Map<string, { count: number; resetAt: number }>();

export function checkPageEditorWriteRateLimit(userId: string): {
  allowed: boolean;
  retryAfterMs?: number;
} {
  const now = Date.now();
  const bucket = buckets.get(userId);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(userId, { count: 1, resetAt: now + WRITE_WINDOW_MS });
    return { allowed: true };
  }

  if (bucket.count >= WRITE_MAX_PER_WINDOW) {
    return { allowed: false, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { allowed: true };
}
