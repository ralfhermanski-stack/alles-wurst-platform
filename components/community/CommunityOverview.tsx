import Link from "next/link";

import { FORUM_TYPE_LABELS } from "@/lib/forums/forum-labels";
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

export default function CommunityOverview({
  forums,
  activity,
}: CommunityOverviewProps) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <h2 className="font-display text-xl font-bold text-aw-cream">
            Forum
          </h2>

          {forums.length === 0 ? (
            <div className="mt-3 border border-aw-border bg-aw-surface/40 px-3 py-3 text-sm text-aw-muted">
              <p>Für dich sind aktuell noch keine Foren freigeschaltet.</p>
              <p className="mt-1">
                Sobald du einen Kurs buchst oder eine Mitgliedschaft aktiv ist,
                erscheinen hier die passenden Foren.
              </p>
            </div>
          ) : (
            <div className="mt-3 divide-y divide-aw-border overflow-hidden rounded-lg border border-aw-border bg-aw-surface/40">
              {forums.map((forum) => (
                <Link
                  key={forum.id}
                  href={`/mein-bereich/foren/${forum.slug}`}
                  className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-0.5 px-3 py-2.5 transition-colors hover:bg-aw-surface-2 sm:grid-cols-[minmax(0,1fr)_5.5rem_5.5rem]"
                >
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-aw-cream">
                      {forum.title}
                    </h3>
                    <p className="mt-0.5 truncate text-[11px] text-aw-muted">
                      {FORUM_TYPE_LABELS[forum.forumType]}
                      {forum.courseTitle ? ` · ${forum.courseTitle}` : ""}
                      {forum.lastActivitySummary
                        ? ` · ${forum.lastActivitySummary}`
                        : ""}
                    </p>
                  </div>
                  <p className="text-right text-xs tabular-nums text-aw-muted sm:text-center">
                    {forum.threadCount} Themen
                  </p>
                  <p className="col-span-2 text-right text-[11px] text-aw-muted sm:col-span-1">
                    {forum.lastActivityAt
                      ? formatDateTime(forum.lastActivityAt)
                      : "—"}
                  </p>
                </Link>
              ))}
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
