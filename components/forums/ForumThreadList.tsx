"use client";

import Link from "next/link";

import type { ForumThreadEntry } from "@/lib/forums/forum-types";

import ForumAuthor from "./ForumAuthor";

type ForumThreadListProps = {
  forumSlug: string;
  threads: ForumThreadEntry[];
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("de-DE");
}

export default function ForumThreadList({
  forumSlug,
  threads,
}: ForumThreadListProps) {
  if (threads.length === 0) {
    return (
      <p className="rounded-xl border border-aw-border bg-aw-surface/30 p-4 text-sm text-aw-muted">
        Noch keine Themen vorhanden.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-aw-border rounded-xl border border-aw-border">
      {threads.map((thread) => (
        <li key={thread.id}>
          <Link
            href={`/mein-bereich/foren/${forumSlug}/${thread.slug}`}
            className="block px-4 py-4 hover:bg-aw-surface/40"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-aw-cream">{thread.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-aw-muted">
                  {thread.body}
                </p>
              </div>
              <div className="text-right text-xs text-aw-muted">
                <p>{thread.replyCount} Antworten</p>
                <p className="mt-1">{formatDate(thread.createdAt)}</p>
              </div>
            </div>
            <div className="mt-3">
              <ForumAuthor author={thread.author} />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
