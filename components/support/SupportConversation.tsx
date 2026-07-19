"use client";

import type { SupportMessageEntry } from "@/lib/support/support-types";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function SupportConversation({
  messages,
}: {
  messages: SupportMessageEntry[];
}) {
  if (messages.length === 0) {
    return (
      <p className="rounded-xl border border-aw-border bg-aw-surface/40 p-6 text-sm text-aw-muted">
        Noch keine Nachrichten im Verlauf.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => {
        const isStaff = message.authorType === "staff";

        return (
          <article
            key={message.id}
            className={`rounded-xl border p-4 ${
              isStaff
                ? message.isNewForUser
                  ? "border-aw-gold/60 bg-aw-gold/15 ring-1 ring-aw-gold/30"
                  : "border-aw-gold/30 bg-aw-gold/5"
                : "border-aw-border bg-aw-surface/40"
            }`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-aw-cream">
                {message.authorDisplayName}
              </p>
              {message.authorRoleBadge && (
                <span className="rounded-full bg-aw-gold/15 px-2 py-0.5 text-xs text-aw-gold">
                  {message.authorRoleBadge}
                </span>
              )}
              {message.isNewForUser && (
                <span className="rounded-full bg-aw-gold px-2 py-0.5 text-xs font-bold text-aw-bg">
                  Neu
                </span>
              )}
              <span className="text-xs text-aw-muted">
                {formatDate(message.createdAt)}
              </span>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-aw-cream/90">
              {message.body}
            </p>
            {message.attachments.length > 0 && (
              <ul className="mt-3 space-y-1">
                {message.attachments.map((attachment) => (
                  <li key={attachment.id}>
                    <a
                      href={`/api/support/attachments/${attachment.id}`}
                      className="text-sm text-aw-gold hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {attachment.fileName}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </article>
        );
      })}
    </div>
  );
}
