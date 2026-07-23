"use client";

import Link from "next/link";

import type { ForumThreadEntry } from "@/lib/forums/forum-types";

import ForumAuthor from "./ForumAuthor";

type ForumThreadListProps = {
  forumSlug: string;
  threads: ForumThreadEntry[];
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ForumThreadList({
  forumSlug,
  threads,
}: ForumThreadListProps) {
  if (threads.length === 0) {
    return (
      <p className="border border-aw-border bg-aw-surface/30 px-3 py-3 text-sm text-aw-muted">
        Noch keine Themen vorhanden.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-aw-border overflow-hidden rounded-lg border border-aw-border">
      {threads.map((thread) => {
        const hasUnread = thread.userUnreadCount > 0;

        return (
          <li key={thread.id}>
            <Link
              href={`/mein-bereich/foren/${forumSlug}/${thread.slug}`}
              className={`grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 px-3 py-2.5 sm:grid-cols-[minmax(0,1fr)_7rem_9rem] ${
                hasUnread
                  ? "border-l-[3px] border-l-aw-gold bg-aw-gold/12 hover:bg-aw-gold/18"
                  : "border-l-[3px] border-l-transparent hover:bg-aw-surface/40"
              }`}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p
                    className={`truncate text-sm ${
                      hasUnread
                        ? "font-bold text-aw-cream"
                        : "font-medium text-aw-cream"
                    }`}
                  >
                    {thread.title}
                  </p>
                  {hasUnread && (
                    <span className="shrink-0 rounded-full bg-aw-gold px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-aw-bg shadow-[0_0_0_1px_rgba(212,175,55,0.35)]">
                      {thread.userUnreadCount > 1
                        ? `${thread.userUnreadCount} neu`
                        : "Neu"}
                    </span>
                  )}
                </div>
                <div className="mt-0.5">
                  <ForumAuthor author={thread.author} size="sm" />
                </div>
              </div>
              <p
                className={`text-right text-xs tabular-nums sm:text-center ${
                  hasUnread ? "font-semibold text-aw-gold" : "text-aw-muted"
                }`}
              >
                {thread.replyCount}{" "}
                <span className="hidden sm:inline">Antworten</span>
                <span className="sm:hidden">Antw.</span>
              </p>
              <p className="col-span-2 text-right text-[11px] text-aw-muted sm:col-span-1 sm:text-right">
                {formatDate(thread.updatedAt)}
              </p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
