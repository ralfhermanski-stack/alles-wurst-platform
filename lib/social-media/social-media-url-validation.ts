/**
 * @file social-media-url-validation.ts
 */

import type { SocialMediaPlatform } from "@prisma/client";

import { ALLOWED_SOCIAL_DOMAINS } from "./social-media-types";

const PLATFORM_HOST_PATTERNS: Record<SocialMediaPlatform, RegExp[]> = {
  TIKTOK: [/^(www\.)?tiktok\.com$/i],
  INSTAGRAM: [/^(www\.)?instagram\.com$/i],
  FACEBOOK: [/^(www\.)?facebook\.com$/i, /^m\.facebook\.com$/i],
  YOUTUBE: [/^(www\.)?youtube\.com$/i, /^youtu\.be$/i],
};

export function validateSocialProfileUrl(
  platform: SocialMediaPlatform,
  url: string,
): { valid: boolean; message?: string; normalized?: string } {
  const trimmed = url.trim();

  if (!trimmed) {
    return { valid: false, message: "Profil-URL ist erforderlich." };
  }

  let parsed: URL;

  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, message: "Die Profil-URL ist ungültig." };
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return { valid: false, message: "Nur http- und https-URLs sind erlaubt." };
  }

  const host = parsed.hostname.toLowerCase();
  const allowedGlobal = ALLOWED_SOCIAL_DOMAINS.some(
    (domain) => host === domain || host.endsWith(`.${domain}`),
  );

  if (!allowedGlobal) {
    return {
      valid: false,
      message: "Diese Domain ist für Social-Media-Links nicht erlaubt.",
    };
  }

  const platformPatterns = PLATFORM_HOST_PATTERNS[platform];
  const matchesPlatform = platformPatterns.some((pattern) => pattern.test(host));

  if (!matchesPlatform) {
    return {
      valid: false,
      message: `Die URL passt nicht zur Plattform ${platform}.`,
    };
  }

  return { valid: true, normalized: parsed.toString() };
}

export function validatePostUrl(url: string): { valid: boolean; message?: string } {
  const trimmed = url.trim();

  if (!trimmed) {
    return { valid: false, message: "Beitrags-URL ist erforderlich." };
  }

  try {
    const parsed = new URL(trimmed);

    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return { valid: false, message: "Nur http- und https-URLs sind erlaubt." };
    }

    const host = parsed.hostname.toLowerCase();
    const allowed = ALLOWED_SOCIAL_DOMAINS.some(
      (domain) => host === domain || host.endsWith(`.${domain}`),
    );

    if (!allowed) {
      return {
        valid: false,
        message: "Diese Domain ist für Beitrags-Links nicht erlaubt.",
      };
    }

    return { valid: true };
  } catch {
    return { valid: false, message: "Die Beitrags-URL ist ungültig." };
  }
}
