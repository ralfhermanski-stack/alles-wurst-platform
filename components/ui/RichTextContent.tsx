/**
 * @file RichTextContent.tsx
 * @purpose Rendert Artikelkörper als Rich-Text (HTML) oder Legacy-Markdown.
 */

import DOMPurify from "isomorphic-dompurify";

import Markdown from "@/components/ui/Markdown";
import {
  addHeadingIdsToHtml,
  isHtmlBody,
} from "@/lib/content/rich-body-utils";

const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "h2",
    "h3",
    "ul",
    "ol",
    "li",
    "a",
    "blockquote",
  ],
  ALLOWED_ATTR: ["href", "id", "target", "rel"],
};

type RichTextContentProps = {
  content: string | null | undefined;
  className?: string;
};

export default function RichTextContent({ content, className }: RichTextContentProps) {
  if (!content?.trim()) {
    return null;
  }

  if (!isHtmlBody(content)) {
    return <Markdown content={content} className={className} />;
  }

  const sanitized = DOMPurify.sanitize(addHeadingIdsToHtml(content), SANITIZE_CONFIG);

  return (
    <div
      className={`prose-blog rich-text-content space-y-3 ${className ?? ""}`}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
