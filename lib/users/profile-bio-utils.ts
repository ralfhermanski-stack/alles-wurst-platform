/**
 * @file profile-bio-utils.ts
 * @purpose Validierung und Normalisierung der Profilbeschreibung (Rich-Text).
 */

import {
  htmlToPlainText,
  isEmptyRichBody,
  normalizeRichBodyOutput,
} from "@/lib/content/rich-body-utils";

export const MAX_PROFILE_BIO_PLAIN_CHARS = 500;
export const MAX_PROFILE_BIO_HTML_CHARS = 10_000;

export function normalizeProfileBioInput(
  raw: string | null | undefined,
): string | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const normalized = normalizeRichBodyOutput(raw);

  return normalized || null;
}

export function isProfileBioFilled(bio: string | null | undefined): boolean {
  if (!bio?.trim()) {
    return false;
  }

  return !isEmptyRichBody(bio);
}

export function validateProfileBio(bio: string | null): string | null {
  if (bio === null) {
    return null;
  }

  if (isEmptyRichBody(bio)) {
    return null;
  }

  if (bio.length > MAX_PROFILE_BIO_HTML_CHARS) {
    throw new Error(
      `Profilbeschreibung ist zu lang (max. ${MAX_PROFILE_BIO_PLAIN_CHARS} Zeichen Text).`,
    );
  }

  const plainLength = htmlToPlainText(bio).trim().length;

  if (plainLength > MAX_PROFILE_BIO_PLAIN_CHARS) {
    throw new Error(
      `Profilbeschreibung ist zu lang (max. ${MAX_PROFILE_BIO_PLAIN_CHARS} Zeichen).`,
    );
  }

  return bio;
}
