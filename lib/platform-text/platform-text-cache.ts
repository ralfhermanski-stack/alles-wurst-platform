/**
 * @file platform-text-cache.ts
 */

type CacheEntry = {
  value: string;
  expiresAt: number;
};

const CACHE_TTL_MS = 5_000;
const cache = new Map<string, CacheEntry>();

export function getCachedPlatformText(key: string): string | null {
  const entry = cache.get(key);

  if (!entry) {
    return null;
  }

  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }

  return entry.value;
}

export function setCachedPlatformText(key: string, value: string): void {
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

export function invalidatePlatformTextCache(key?: string): void {
  if (key) {
    cache.delete(key);
    return;
  }

  cache.clear();
}
