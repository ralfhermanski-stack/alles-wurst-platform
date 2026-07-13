/**
 * @file blog-seo-text-utils.ts
 * @purpose Textbereinigung für SEO-/KI-Analyse.
 */

import { bodyToPlainText, extractHeadingsFromBody } from "@/lib/content/rich-body-utils";

const GERMAN_STOP_WORDS = new Set([
  "aber", "alle", "als", "also", "andere", "auch", "auf", "aus", "bei", "bin",
  "bis", "bist", "da", "damit", "dann", "das", "dass", "dein", "deine", "dem",
  "den", "der", "des", "die", "dies", "dieser", "doch", "du", "durch", "ein",
  "eine", "einem", "einen", "einer", "eines", "er", "es", "euch", "für", "hat",
  "hier", "ich", "ihr", "ihre", "im", "in", "ist", "kann", "man", "mit", "nach",
  "nicht", "noch", "nur", "oder", "schon", "sehr", "sein", "sich", "sie", "sind",
  "so", "und", "uns", "vom", "von", "vor", "war", "was", "wenn", "wer", "wie",
  "wird", "wir", "wo", "zu", "zum", "zur", "the", "and", "for", "with",
]);

export function markdownToPlainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]+`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_~>#-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractHeadingsFromMarkdown(body: string): string[] {
  return extractHeadingsFromBody(body);
}

export function truncateText(text: string, maxLength: number): string {
  const cleaned = text.replace(/\s+/g, " ").trim();

  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  const slice = cleaned.slice(0, maxLength);
  const lastSpace = slice.lastIndexOf(" ");

  if (lastSpace > maxLength * 0.6) {
    return `${slice.slice(0, lastSpace).trim()}…`;
  }

  return `${slice.trim()}…`;
}

export function clampMetaDescription(text: string): string {
  const cleaned = text.replace(/\s+/g, " ").trim();

  if (cleaned.length >= 140 && cleaned.length <= 160) {
    return cleaned;
  }

  if (cleaned.length > 160) {
    return truncateText(cleaned, 157);
  }

  return cleaned;
}

export function truncateSeoTitle(text: string): string {
  return truncateText(text, 60);
}

export function extractFrequentKeywords(text: string, limit = 8): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-zäöüß0-9\s-]/gi, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 4 && !GERMAN_STOP_WORDS.has(word));

  const counts = new Map<string, number>();

  for (const word of words) {
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

export function extractParagraphAfterHeading(body: string, heading: string): string {
  const lines = body.split("\n");
  let capture = false;
  const parts: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("## ") || trimmed.startsWith("### ")) {
      if (capture) {
        break;
      }

      if (trimmed.replace(/^#+\s+/, "") === heading) {
        capture = true;
      }

      continue;
    }

    if (capture && trimmed) {
      parts.push(trimmed);
    }
  }

  return markdownToPlainText(parts.join(" "));
}

export function computeReadabilityScore(body: string): number {
  const plain = bodyToPlainText(body);
  const words = plain.split(/\s+/).filter(Boolean).length;

  if (words === 0) {
    return 0;
  }

  const sentences = plain.split(/[.!?]+/).filter((part) => part.trim()).length || 1;
  const avgWords = words / sentences;

  if (avgWords <= 14) return 92;
  if (avgWords <= 18) return 82;
  if (avgWords <= 22) return 72;
  if (avgWords <= 28) return 58;
  return 45;
}
