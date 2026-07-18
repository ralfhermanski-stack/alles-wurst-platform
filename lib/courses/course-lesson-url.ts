/**
 * @file course-lesson-url.ts
 * @purpose Validierung optionaler Ressourcen-Links in Kurslektionen.
 */

export function normalizeLessonExternalUrl(
  value: string | null | undefined,
): string | null {
  const trimmed = value?.trim() || "";

  if (!trimmed) {
    return null;
  }

  try {
    const url = new URL(trimmed);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

export function isValidLessonExternalUrl(
  value: string | null | undefined,
): boolean {
  if (!value?.trim()) {
    return true;
  }

  return normalizeLessonExternalUrl(value) !== null;
}
