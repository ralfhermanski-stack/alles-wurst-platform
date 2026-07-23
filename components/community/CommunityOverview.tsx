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

function ForumRow({
  forum,
  depth = 0,
}: {
  forum: CommunityForumEntry;
  depth?: number;
}) {
  const hasUnread = forum.unreadCount > 0;
  const paddingClass = depth > 0 ? "pl-7 sm:pl-10" : "";

  if (!forum.canOpen) {
    return (
      <div
        className={`grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-0.5 border-l-2 border-aw-border/60 px-3 py-2.5 opacity-75 ${paddingClass}`}
        title={`${forum.readRuleLabel} — noch kein Zugang`}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-medium text-aw-muted">
              {forum.title}
            </h3>
            <AccessBadge label={forum.accessBadge} />
            <span className="text-[10px] font-semibold uppercase tracking-wide text-aw-muted">
              Gesperrt
            </span>
          </div>
          <p className="mt-0.5 truncate text-[11px] text-aw-muted">
            {forum.readRuleLabel}
            {forum.courseTitle ? ` · ${forum.courseTitle}` : ""}
          </p>
        </div>
        <p className="text-right text-xs text-aw-muted">🔒</p>
      </div>
    );
  }

  return (
    <Link
      href={`/mein-bereich/foren/${forum.slug}`}
      className={`grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-0.5 px-3 py-2.5 transition-colors sm:grid-cols-[minmax(0,1fr)_5.5rem_5.5rem] ${paddingClass} ${
        hasUnread
          ? "border-l-2 border-aw-gold bg-aw-gold/10 hover:bg-aw-gold/15"
          : "border-l-2 border-transparent hover:bg-aw-surface-2"
      }`}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3
            className={`truncate text-sm ${
              hasUnread
                ? "font-bold text-aw-cream"
                : "font-semibold text-aw-cream"
            }`}
          >
            {forum.title}
          </h3>
          <AccessBadge label={forum.accessBadge} />
          <UnreadBadge count={forum.unreadCount} />
        </div>
        <p className="mt-0.5 truncate text-[11px] text-aw-muted">
          {forum.readRuleLabel}
          {forum.courseTitle ? ` · ${forum.courseTitle}` : ""}
          {forum.lastActivitySummary ? ` · ${forum.lastActivitySummary}` : ""}
        </p>
      </div>
      <p
        className={`text-right text-xs tabular-nums sm:text-center ${
          hasUnread ? "font-semibold text-aw-gold" : "text-aw-muted"
        }`}
      >
        {forum.threadCount} Themen
      </p>
      <p className="col-span-2 text-right text-[11px] text-aw-muted sm:col-span-1">
        {forum.lastActivityAt ? formatDateTime(forum.lastActivityAt) : "—"}
      </p>
    </Link>
  );
}

function ForumGroup({ forum }: { forum: CommunityForumEntry }) {
  const hasChildren = forum.children.length > 0;
  const defaultOpen = forum.unreadCount > 0 || !hasChildren;
  const [expanded, setExpanded] = useState(defaultOpen);

  if (!hasChildren) {
    return <ForumRow forum={forum} />;
  }

  return (
    <div>
      <div className="flex items-stretch">
        <button
          type="button"
          aria-expanded={expanded}
          aria-label={expanded ? "Unterforen einklappen" : "Unterforen ausklappen"}
          className="shrink-0 border-b border-aw-border px-2 text-aw-gold hover:bg-aw-surface-2"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "▾" : "▸"}
        </button>
        <div className="min-w-0 flex-1 border-b border-aw-border">
          <ForumRow
            forum={{
              ...forum,
              // Oberforum-Zähler ohne Doppelzählung der Kinder in der Zeile
              unreadCount: Math.max(
                0,
                forum.unreadCount -
                  forum.children.reduce((sum, c) => sum + c.unreadCount, 0),
              ),
              threadCount: Math.max(
                0,
                forum.threadCount -
                  forum.children.reduce((sum, c) => sum + c.threadCount, 0),
              ),
            }}
          />
        </div>
      </div>

      {expanded && (
        <div className="border-b border-aw-border bg-aw-bg/20">
          <p className="px-3 pt-2 text-[10px] font-semibold uppercase tracking-wide text-aw-muted">
            Unterforen
          </p>
          {forum.children.map((child) => (
            <ForumRow key={child.id} forum={child} depth={1} />
          ))}
        </div>
      )}
    </div>
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
            <div className="mt-3 overflow-hidden rounded-lg border border-aw-border bg-aw-surface/40">
              <div className="divide-y divide-aw-border">
                {forums.map((forum) => (
                  <ForumGroup key={forum.id} forum={forum} />
                ))}
              </div>
              <p className="border-t border-aw-border px-3 py-2 text-[11px] text-aw-muted">
                Badges zeigen deinen Zugang: Registriert, Kurs, Wurstclub oder
                Meisterclub. Gesperrte Clubforen erscheinen mit Schloss — Kursforen
                erst nach Buchung.
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
