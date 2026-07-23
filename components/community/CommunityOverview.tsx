"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type {
  CommunityActivityEntry,
  CommunityForumEntry,
} from "@/lib/forums/forum-types";

type CommunityOverviewProps = {
  forums: CommunityForumEntry[];
  activity: CommunityActivityEntry[];
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AccessBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded border border-aw-gold/35 bg-aw-gold/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-aw-gold">
      {label}
    </span>
  );
}

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) {
    return null;
  }

  return (
    <span className="inline-flex min-w-5 shrink-0 items-center justify-center rounded-full bg-aw-gold px-1.5 py-0.5 text-[10px] font-bold text-aw-bg">
      {count > 99 ? "99+" : count} neu
    </span>
  );
}

function StatusIcon({
  canOpen,
  hasUnread,
}: {
  canOpen: boolean;
  hasUnread: boolean;
}) {
  if (!canOpen) {
    return (
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-aw-border/70 bg-aw-bg/40 text-sm text-aw-muted"
        aria-hidden
      >
        🔒
      </span>
    );
  }

  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded border text-sm ${
        hasUnread
          ? "border-aw-gold/50 bg-aw-gold/15 text-aw-gold"
          : "border-aw-border/70 bg-aw-bg/40 text-aw-muted"
      }`}
      aria-hidden
    >
      {hasUnread ? "●" : "○"}
    </span>
  );
}

function ColumnHeaders() {
  return (
    <div className="hidden grid-cols-[minmax(0,1fr)_4.5rem_4.5rem_minmax(7rem,11rem)] gap-3 border-b border-aw-border/80 bg-aw-bg/30 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-aw-muted sm:grid">
      <span>Forum</span>
      <span className="text-center">Themen</span>
      <span className="text-center">Beiträge</span>
      <span className="text-right">Letzter Beitrag</span>
    </div>
  );
}

function SubforumRow({ forum }: { forum: CommunityForumEntry }) {
  const hasUnread = forum.unreadCount > 0;
  const description =
    forum.description?.trim() ||
    [forum.readRuleLabel, forum.courseTitle].filter(Boolean).join(" · ");

  const statsClass = hasUnread
    ? "font-semibold text-aw-gold"
    : "text-aw-muted";

  const body = (
    <>
      <StatusIcon canOpen={forum.canOpen} hasUnread={hasUnread} />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3
            className={`truncate text-sm ${
              hasUnread
                ? "font-bold text-aw-cream"
                : forum.canOpen
                  ? "font-semibold text-aw-cream"
                  : "font-medium text-aw-muted"
            }`}
          >
            {forum.title}
          </h3>
          <AccessBadge label={forum.accessBadge} />
          <UnreadBadge count={forum.unreadCount} />
          {!forum.canOpen && (
            <span className="text-[10px] font-semibold uppercase tracking-wide text-aw-muted">
              Gesperrt
            </span>
          )}
        </div>
        {description ? (
          <p className="mt-0.5 line-clamp-2 text-[11px] text-aw-muted">
            {description}
          </p>
        ) : null}
        <p className="mt-1 text-[11px] text-aw-muted sm:hidden">
          {forum.threadCount} Themen · {forum.postCount} Beiträge
          {forum.lastActivityAt
            ? ` · ${formatDateTime(forum.lastActivityAt)}`
            : ""}
        </p>
      </div>
      <p className={`hidden text-center text-xs tabular-nums sm:block ${statsClass}`}>
        {forum.threadCount}
      </p>
      <p className={`hidden text-center text-xs tabular-nums sm:block ${statsClass}`}>
        {forum.postCount}
      </p>
      <div className="hidden min-w-0 text-right sm:block">
        {forum.lastActivityAt ? (
          <>
            <p className="truncate text-[11px] text-aw-cream/85">
              {forum.lastActivitySummary ?? "Aktivität"}
            </p>
            <p className="text-[10px] text-aw-muted">
              {formatDateTime(forum.lastActivityAt)}
            </p>
          </>
        ) : (
          <p className="text-[11px] text-aw-muted">—</p>
        )}
      </div>
    </>
  );

  const rowClass = `grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 px-3 py-2.5 sm:grid-cols-[auto_minmax(0,1fr)_4.5rem_4.5rem_minmax(7rem,11rem)] sm:items-center ${
    hasUnread
      ? "border-l-2 border-aw-gold bg-aw-gold/10"
      : "border-l-2 border-transparent"
  }`;

  if (!forum.canOpen) {
    return (
      <div
        className={`${rowClass} opacity-80`}
        title={`${forum.readRuleLabel} — noch kein Zugang`}
      >
        {body}
      </div>
    );
  }

  return (
    <Link
      href={`/mein-bereich/foren/${forum.slug}`}
      className={`${rowClass} transition-colors hover:bg-aw-surface-2 ${
        hasUnread ? "hover:bg-aw-gold/15" : ""
      }`}
    >
      {body}
    </Link>
  );
}

function CategorySection({ forum }: { forum: CommunityForumEntry }) {
  const hasChildren = forum.children.length > 0;
  const [expanded, setExpanded] = useState(true);
  const sectionUnread = hasChildren
    ? forum.children.reduce((sum, child) => sum + child.unreadCount, 0)
    : forum.unreadCount;

  if (!hasChildren) {
    return (
      <section className="overflow-hidden rounded-lg border border-aw-border bg-aw-surface/40">
        <ColumnHeaders />
        <SubforumRow forum={forum} />
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border border-aw-border bg-aw-surface/40">
      <div
        className={`flex items-center gap-2 border-b border-aw-border px-3 py-2 ${
          sectionUnread > 0 ? "bg-aw-gold/10" : "bg-aw-bg/45"
        }`}
      >
        <button
          type="button"
          aria-expanded={expanded}
          aria-label={
            expanded ? "Unterforen einklappen" : "Unterforen ausklappen"
          }
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-aw-gold hover:bg-aw-surface-2"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "▾" : "▸"}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-aw-cream sm:text-base">
              {forum.title}
            </h2>
            <UnreadBadge count={sectionUnread} />
          </div>
          {forum.description?.trim() ? (
            <p className="mt-0.5 truncate text-[11px] text-aw-muted">
              {forum.description.trim()}
            </p>
          ) : null}
        </div>
        <p className="hidden text-[10px] uppercase tracking-wide text-aw-muted sm:block">
          {forum.children.length}{" "}
          {forum.children.length === 1 ? "Unterforum" : "Unterforen"}
        </p>
      </div>

      {expanded ? (
        <>
          <ColumnHeaders />
          <div className="divide-y divide-aw-border/70">
            {forum.children.map((child) => (
              <SubforumRow key={child.id} forum={child} />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}

export default function CommunityOverview({
  forums,
  activity,
}: CommunityOverviewProps) {
  const totalUnread = useMemo(
    () => forums.reduce((sum, forum) => sum + forum.unreadCount, 0),
    [forums],
  );

  return (
    <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className="font-display text-xl font-bold text-aw-cream">
              Forum
            </h2>
            {totalUnread > 0 && (
              <p className="text-xs font-semibold text-aw-gold">
                {totalUnread} ungelesene{" "}
                {totalUnread === 1 ? "Thema" : "Themen"}
              </p>
            )}
          </div>

          {forums.length === 0 ? (
            <div className="mt-3 border border-aw-border bg-aw-surface/40 px-3 py-3 text-sm text-aw-muted">
              <p>Für dich sind aktuell noch keine Foren freigeschaltet.</p>
              <p className="mt-1">
                Sobald du einen Kurs buchst oder eine Mitgliedschaft aktiv ist,
                erscheinen hier die passenden Foren.
              </p>
            </div>
          ) : (
            <div className="mt-3 space-y-4">
              {forums.map((forum) => (
                <CategorySection key={forum.id} forum={forum} />
              ))}
              <p className="px-1 text-[11px] text-aw-muted">
                Badges zeigen deinen Zugang: Registriert, Kurs, Wurstclub oder
                Meisterclub. Gesperrte Clubforen erscheinen mit Schloss —
                Kursforen erst nach Buchung.
              </p>
            </div>
          )}
        </div>

        <aside>
          <h2 className="font-display text-xl font-bold text-aw-cream">
            Aktivität
          </h2>

          {activity.length === 0 ? (
            <p className="mt-3 border border-aw-border bg-aw-surface/40 px-3 py-3 text-sm text-aw-muted">
              Noch keine aktuellen Aktivitäten vorhanden.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-aw-border overflow-hidden rounded-lg border border-aw-border">
              {activity.map((entry) => (
                <li key={entry.id} className="px-3 py-2 text-sm">
                  <Link
                    href={`/mein-bereich/foren/${entry.forumSlug}/${entry.threadSlug}`}
                    className="block hover:text-aw-gold"
                  >
                    <span className="font-medium text-aw-gold">
                      {entry.authorDisplayName}
                    </span>{" "}
                    <span className="text-aw-cream/90">{entry.summary}</span>
                    <p className="mt-0.5 truncate text-[11px] text-aw-muted">
                      {entry.threadTitle} · {entry.forumTitle} ·{" "}
                      {formatDateTime(entry.createdAt)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <p className="mt-4 text-xs text-aw-muted">
            Private Nachrichten an Support folgen später im Bereich „Mein
            Bereich“ — nicht im Forum.
          </p>
        </aside>
      </div>
    </section>
  );
}
