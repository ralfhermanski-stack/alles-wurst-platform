import type { ForumAuthorEntry } from "@/lib/forums/forum-types";

import ForumAuthor from "./ForumAuthor";
import ForumPostSignature from "./ForumPostSignature";

type ForumPostProps = {
  author: ForumAuthorEntry;
  body: string;
  createdAt: string;
  forumSignature?: string | null;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("de-DE");
}

/**
 * Klassischer Forenbeitrag: schmale Autorenspalte links, Inhalt rechts.
 */
export default function ForumPost({
  author,
  body,
  createdAt,
  forumSignature = null,
}: ForumPostProps) {
  return (
    <article className="border-b border-aw-border last:border-b-0">
      <div className="flex flex-col sm:flex-row">
        <aside className="flex shrink-0 items-center gap-2 border-b border-aw-border/70 bg-aw-surface/25 px-3 py-2 sm:w-36 sm:flex-col sm:items-stretch sm:gap-0 sm:border-b-0 sm:border-r sm:px-3 sm:py-3">
          <ForumAuthor author={author} layout="stack" size="md" />
        </aside>

        <div className="min-w-0 flex-1 px-3 py-2.5 sm:px-4 sm:py-3">
          <time
            dateTime={createdAt}
            className="mb-1.5 block text-[11px] text-aw-muted"
          >
            {formatDate(createdAt)}
          </time>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-aw-cream">
            {body}
          </p>
          {forumSignature ? <ForumPostSignature html={forumSignature} /> : null}
        </div>
      </div>
    </article>
  );
}
