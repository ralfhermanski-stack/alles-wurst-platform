/**
 * @file rich-body-utils.ts
 * @purpose Hilfsfunktionen für Rich-Text- und Markdown-Artikelkörper.
 */

import { marked } from "marked";

import { markdownToPlainText } from "@/lib/blog/blog-seo-text-utils";

marked.setOptions({
  gfm: true,
  breaks: true,
});

export function slugifyHeading(value: string): string {
  return value
    .replace(/<[^>]+>/g, "")
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isHtmlBody(body: string): boolean {
  const trimmed = body.trim();

  if (!trimmed) {
    return false;
  }

  return /^<[a-z][\s\S]*>/i.test(trimmed);
}

export function markdownToHtml(markdown: string): string {
  if (!markdown.trim()) {
    return "";
  }

  return marked.parse(markdown, { async: false }) as string;
}

export function prepareEditorContent(body: string): string {
  if (!body.trim()) {
    return "";
  }

  if (isHtmlBody(body)) {
    return body;
  }

  return markdownToHtml(body);
}

export function isEmptyRichBody(html: string): boolean {
  return !html.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();
}

export function normalizeRichBodyOutput(html: string): string {
  if (isEmptyRichBody(html)) {
    return "";
  }

  return html;
}

export function htmlToPlainText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>/gi, " ")
    .replace(/<\/h[1-6]>/gi, " ")
    .replace(/<\/li>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function bodyToPlainText(body: string): string {
  if (!body.trim()) {
    return "";
  }

  if (isHtmlBody(body)) {
    return htmlToPlainText(body);
  }

  return markdownToPlainText(body);
}

export function countWordsInBody(body: string): number {
  return bodyToPlainText(body).split(/\s+/).filter(Boolean).length;
}

export function countHeadingsInBody(body: string): { h1: number; h2: number; h3: number } {
  if (isHtmlBody(body)) {
    const h1 = (body.match(/<h1[\s>]/gi) ?? []).length;
    const h2 = (body.match(/<h2[\s>]/gi) ?? []).length;
    const h3 = (body.match(/<h3[\s>]/gi) ?? []).length;
    return { h1, h2, h3 };
  }

  const lines = body.split("\n");
  let h1 = 0;
  let h2 = 0;
  let h3 = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("# ")) h1 += 1;
    else if (trimmed.startsWith("## ")) h2 += 1;
    else if (trimmed.startsWith("### ")) h3 += 1;
  }

  return { h1, h2, h3 };
}

export function extractHeadingsFromBody(body: string): string[] {
  const headings: string[] = [];

  if (isHtmlBody(body)) {
    const pattern = /<h([23])[^>]*>([\s\S]*?)<\/h\1>/gi;

    for (const match of body.matchAll(pattern)) {
      const label = htmlToPlainText(match[2] ?? "").trim();

      if (label) {
        headings.push(label);
      }
    }

    return headings;
  }

  for (const line of body.split("\n")) {
    const trimmed = line.trim();

    if (trimmed.startsWith("## ") || trimmed.startsWith("### ")) {
      headings.push(trimmed.replace(/^#+\s+/, "").trim());
    }
  }

  return headings;
}

export function extractTableOfContentsFromBody(
  body: string,
): { id: string; label: string; level: 2 | 3 }[] {
  const items: { id: string; label: string; level: 2 | 3 }[] = [];

  if (isHtmlBody(body)) {
    const pattern = /<h([23])[^>]*>([\s\S]*?)<\/h\1>/gi;

    for (const match of body.matchAll(pattern)) {
      const level = Number(match[1]) as 2 | 3;
      const label = htmlToPlainText(match[2] ?? "").trim();

      if (!label) {
        continue;
      }

      items.push({ id: slugifyHeading(label), label, level });
    }

    return items;
  }

  for (const line of body.split("\n")) {
    const trimmed = line.trim();
    let level: 2 | 3 | null = null;
    let label = "";

    if (trimmed.startsWith("## ")) {
      level = 2;
      label = trimmed.slice(3).trim();
    } else if (trimmed.startsWith("### ")) {
      level = 3;
      label = trimmed.slice(4).trim();
    }

    if (!level || !label) {
      continue;
    }

    items.push({ id: slugifyHeading(label), label, level });
  }

  return items;
}

export function addHeadingIdsToHtml(html: string): string {
  return html.replace(/<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi, (match, level, attrs, inner) => {
    if (/\bid\s*=/.test(attrs)) {
      return match;
    }

    const label = htmlToPlainText(inner).trim();
    const id = slugifyHeading(label);

    if (!id) {
      return match;
    }

    return `<h${level}${attrs} id="${id}">${inner}</h${level}>`;
  });
}
