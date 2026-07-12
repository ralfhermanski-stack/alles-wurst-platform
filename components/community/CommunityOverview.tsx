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
  return new Date(iso).toLocaleString("de-DE");
}

export default function CommunityOverview({
  forums,
  activity,
}: CommunityOverviewProps) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <h2 className="font-display text-2xl font-bold text-aw-cream">
            Forum
          </h2>

          {forums.length === 0 ? (
            <div className="mt-6 rounded-xl border border-aw-border bg-aw-surface/40 p-6 text-sm text-aw-muted">
              <p>Für dich sind aktuell noch keine Foren freigeschaltet.</p>
              <p className="mt-2">
                Sobald du einen Kurs buchst oder eine Mitgliedschaft aktiv ist,
                erscheinen hier die passenden Foren.
              </p>
            </div>
          ) : (
            <div className="mt-6 divide-y divide-aw-border overflow-hidden rounded-xl border border-aw-border bg-aw-surface">
              {forums.map((forum) => (
                <Link
                  key={forum.id}
                  href={`/mein-bereich/foren/${forum.slug}`}
                  className="flex items-start justify-between gap-4 p-5 transition-colors hover:bg-aw-surface-2"
                >
                  <div className="min-w-0">
                    <h3 className="font-semibold text-aw-cream">
                      {forum.title}
                    </h3>
                    <p className="mt-1 text-xs text-aw-muted">
                      {FORUM_TYPE_LABELS[forum.forumType]}
                      {forum.courseTitle ? ` · ${forum.courseTitle}` : ""}
                    </p>
                    {forum.description && (
                      <p className="mt-2 text-sm text-aw-muted line-clamp-2">
                        {forum.description}
                      </p>
                    )}
                    {forum.lastActivitySummary && (
                      <p className="mt-2 text-xs text-aw-muted">
                        Letzte Aktivität: {forum.lastActivitySummary}
                        {forum.lastActivityAt
                          ? ` · ${formatDateTime(forum.lastActivityAt)}`
                          : ""}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right text-xs text-aw-muted">
                    <p>{forum.threadCount} Themen</p>
                    <p>{forum.postCount} Beiträge</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <aside>
          <h2 className="font-display text-2xl font-bold text-aw-cream">
            Aktivität
          </h2>

          {activity.length === 0 ? (
            <p className="mt-6 rounded-xl border border-aw-border bg-aw-surface/40 p-4 text-sm text-aw-muted">
              Noch keine aktuellen Aktivitäten vorhanden.
            </p>
          ) : (
            <ul className="mt-6 space-y-4">
              {activity.map((entry) => (
                <li
                  key={entry.id}
                  className="rounded-lg border border-aw-border bg-aw-surface p-4 text-sm"
                >
                  <span className="font-semibold text-aw-gold">
                    {entry.authorDisplayName}
                  </span>{" "}
                  <span className="text-aw-cream/90">{entry.summary}</span>
                  <p className="mt-1 text-xs text-aw-muted">
                    {entry.forumTitle} · {formatDateTime(entry.createdAt)}
                  </p>
                  <Link
                    href={`/mein-bereich/foren/${entry.forumSlug}/${entry.threadSlug}`}
                    className="mt-2 inline-block text-xs text-aw-gold hover:underline"
                  >
                    Thema öffnen
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 rounded-lg border border-aw-border bg-aw-surface-2 p-4 text-sm text-aw-muted">
            Private Nachrichten an Support folgen später im Bereich „Mein
            Bereich“ — nicht im Forum.
          </div>
        </aside>
      </div>
    </section>
  );
}
