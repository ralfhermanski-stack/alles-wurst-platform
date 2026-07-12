import Link from "next/link";

import { getSessionUserIdFromCookies } from "@/lib/auth/session";
import { getVisibleForumsForUser } from "@/lib/forums/forum-service";

type HelpCommunityForumsProps = {
  askCommunityLabel: string;
  compact?: boolean;
};

export default async function HelpCommunityForums({
  askCommunityLabel,
  compact = false,
}: HelpCommunityForumsProps) {
  const userId = await getSessionUserIdFromCookies();
  const forums = await getVisibleForumsForUser(userId);
  const visibleForums = forums.slice(0, compact ? 4 : 6);

  return (
    <div className="rounded-2xl border border-aw-border bg-aw-surface/40 p-6">
      <h2 className="font-display text-lg font-bold text-aw-cream">
        Frage die Community
      </h2>

      {visibleForums.length > 0 ? (
        <>
          <p className="mt-2 text-sm text-aw-muted">
            Diese Foren stehen dir zur Verfügung:
          </p>
          <ul className="mt-4 space-y-2">
            {visibleForums.map((forum) => (
              <li key={forum.id}>
                <Link
                  href={`/mein-bereich/foren/${forum.slug}`}
                  className="text-sm font-medium text-aw-gold hover:text-aw-cream"
                >
                  {forum.title}
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="mt-2 text-sm text-aw-muted">
          {userId
            ? "Aktuell sind keine Foren für dein Konto sichtbar."
            : "Melde dich an, um Foren zu sehen, auf die du Zugriff hast."}
        </p>
      )}

      <Link
        href={userId ? "/community" : "/anmelden?next=/community"}
        className="mt-4 inline-flex text-sm font-semibold text-aw-gold hover:text-aw-cream"
      >
        {askCommunityLabel} →
      </Link>
    </div>
  );
}
