/**
 * @file vimeo-embed.ts
 * @purpose Vimeo-Embed-URLs ohne direkten Video-Link-Leak.
 */

/**
 * Erzeugt eine Player-URL nur aus der Vimeo-Video-ID.
 * Die Roh-URL wird nicht in der UI angezeigt.
 */
export function buildVimeoEmbedUrl(videoId: string): string {
  const sanitized = parseVimeoVideoInput(videoId);

  if (!sanitized) {
    return "";
  }

  return `https://player.vimeo.com/video/${sanitized}?dnt=1&title=0&byline=0&portrait=0`;
}

/**
 * Extrahiert eine Vimeo-Video-ID aus Roh-ID, Share-URL oder Embed-URL.
 */
export function parseVimeoVideoInput(
  input: string | null | undefined,
): string {
  if (!input?.trim()) {
    return "";
  }

  const trimmed = input.trim();

  if (/^\d+$/.test(trimmed)) {
    return trimmed;
  }

  const embedMatch = trimmed.match(/vimeo\.com\/video\/(\d+)/i);

  if (embedMatch?.[1]) {
    return embedMatch[1];
  }

  const shareMatch = trimmed.match(/vimeo\.com\/(\d+)/i);

  if (shareMatch?.[1]) {
    return shareMatch[1];
  }

  const digitsOnly = trimmed.replace(/\D/g, "");

  return digitsOnly;
}

export function hasValidVimeoInput(input: string | null | undefined): boolean {
  return parseVimeoVideoInput(input).length > 0;
}
