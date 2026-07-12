/**
 * @file Markdown.tsx
 * @purpose Sicherer, minimaler Markdown-Renderer.
 *
 * Rendert ausschließlich React-Elemente (niemals dangerouslySetInnerHTML),
 * dadurch ist die Ausgabe automatisch gegen HTML-Injection geschützt.
 *
 * Unterstützt bewusst nur eine einfache Teilmenge:
 *   - Überschriften  (#, ##, ###)
 *   - Absätze        (durch Leerzeile getrennt)
 *   - Zeilenumbrüche (einfacher Umbruch innerhalb eines Absatzes)
 *   - Listen         (-, * bzw. 1. )
 *   - fett (**text**) und kursiv (*text* / _text_)
 */

import type { ReactNode } from "react";

const INLINE_PATTERN = /(\*\*([^*]+)\*\*|\*([^*\n]+)\*|_([^_\n]+)_)/g;

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let matchIndex = 0;

  for (const match of text.matchAll(INLINE_PATTERN)) {
    const start = match.index ?? 0;

    if (start > lastIndex) {
      nodes.push(text.slice(lastIndex, start));
    }

    if (match[2] !== undefined) {
      nodes.push(
        <strong key={`${keyPrefix}-b-${matchIndex}`} className="font-semibold text-aw-cream">
          {match[2]}
        </strong>,
      );
    } else if (match[3] !== undefined || match[4] !== undefined) {
      nodes.push(
        <em key={`${keyPrefix}-i-${matchIndex}`}>{match[3] ?? match[4]}</em>,
      );
    }

    lastIndex = start + match[0].length;
    matchIndex += 1;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

function renderParagraph(
  lines: string[],
  key: string,
  variant: MarkdownVariant,
): ReactNode {
  const content: ReactNode[] = [];

  lines.forEach((line, index) => {
    if (index > 0) {
      content.push(<br key={`${key}-br-${index}`} />);
    }

    content.push(...renderInline(line, `${key}-l-${index}`));
  });

  const paragraphClass =
    variant === "sales"
      ? "text-lg leading-[1.75] text-aw-cream/85"
      : "text-sm leading-7 text-aw-muted";

  return (
    <p key={key} className={paragraphClass}>
      {content}
    </p>
  );
}

type MarkdownVariant = "default" | "sales";

const HEADING_PATTERN = /^(#{1,3})\s+(.*)$/;
const UL_PATTERN = /^\s*[-*]\s+(.*)$/;
const OL_PATTERN = /^\s*\d+\.\s+(.*)$/;

function parseBlocks(markdown: string, variant: MarkdownVariant): ReactNode[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];

  let paragraph: string[] = [];
  let blockIndex = 0;

  function flushParagraph(): void {
    if (paragraph.length > 0) {
      blocks.push(renderParagraph(paragraph, `p-${blockIndex}`, variant));
      blockIndex += 1;
      paragraph = [];
    }
  }

  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      flushParagraph();
      i += 1;
      continue;
    }

    const heading = HEADING_PATTERN.exec(line);

    if (heading) {
      flushParagraph();
      const level = heading[1].length;
      const text = heading[2];
      const className =
        level === 1
          ? "mt-4 font-display text-xl font-bold text-aw-cream"
          : level === 2
            ? "mt-4 font-display text-lg font-bold text-aw-cream"
            : "mt-3 font-display text-base font-semibold text-aw-cream";
      const key = `h-${blockIndex}`;

      blocks.push(
        level === 1 ? (
          <h3 key={key} className={className}>
            {renderInline(text, key)}
          </h3>
        ) : level === 2 ? (
          <h4 key={key} className={className}>
            {renderInline(text, key)}
          </h4>
        ) : (
          <h5 key={key} className={className}>
            {renderInline(text, key)}
          </h5>
        ),
      );
      blockIndex += 1;
      i += 1;
      continue;
    }

    if (UL_PATTERN.test(line)) {
      flushParagraph();
      const items: string[] = [];

      while (i < lines.length) {
        const match = UL_PATTERN.exec(lines[i]);

        if (!match) {
          break;
        }

        items.push(match[1]);
        i += 1;
      }

      const key = `ul-${blockIndex}`;
      const listClass =
        variant === "sales"
          ? "mt-3 list-disc space-y-2 pl-5 text-lg leading-[1.75] text-aw-cream/85"
          : "mt-2 list-disc space-y-1 pl-5 text-sm leading-7 text-aw-muted";
      blocks.push(
        <ul key={key} className={listClass}>
          {items.map((item, index) => (
            <li key={`${key}-${index}`}>{renderInline(item, `${key}-${index}`)}</li>
          ))}
        </ul>,
      );
      blockIndex += 1;
      continue;
    }

    if (OL_PATTERN.test(line)) {
      flushParagraph();
      const items: string[] = [];

      while (i < lines.length) {
        const match = OL_PATTERN.exec(lines[i]);

        if (!match) {
          break;
        }

        items.push(match[1]);
        i += 1;
      }

      const key = `ol-${blockIndex}`;
      const olClass =
        variant === "sales"
          ? "mt-3 list-decimal space-y-2 pl-5 text-lg leading-[1.75] text-aw-cream/85"
          : "mt-2 list-decimal space-y-1 pl-5 text-sm leading-7 text-aw-muted";
      blocks.push(
        <ol key={key} className={olClass}>
          {items.map((item, index) => (
            <li key={`${key}-${index}`}>{renderInline(item, `${key}-${index}`)}</li>
          ))}
        </ol>,
      );
      blockIndex += 1;
      continue;
    }

    paragraph.push(line);
    i += 1;
  }

  flushParagraph();

  return blocks;
}

type MarkdownProps = {
  content: string | null | undefined;
  className?: string;
  variant?: MarkdownVariant;
};

/**
 * Rendert Markdown sicher als React-Elemente.
 * Gibt null zurück, wenn kein Inhalt vorhanden ist.
 */
export default function Markdown({
  content,
  className,
  variant = "default",
}: MarkdownProps) {
  if (!content?.trim()) {
    return null;
  }

  const spacing = variant === "sales" ? "space-y-6" : "space-y-3";

  return (
    <div className={`${spacing} ${className ?? ""}`}>
      {parseBlocks(content, variant)}
    </div>
  );
}
