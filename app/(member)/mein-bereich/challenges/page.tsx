import Link from "next/link";

import { getSessionUserIdFromCookies } from "@/lib/auth/session";
import { listUserChallengeOverview } from "@/lib/challenges/challenge-submission-service";

export default async function MemberChallengesPage() {
  const userId = await getSessionUserIdFromCookies();

  if (!userId) {
    return null;
  }

  const overview = await listUserChallengeOverview(userId);

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-aw-cream">Challenges</h1>
        <p className="mt-1 text-sm text-aw-muted">Deine Teilnahmen und aktuelle Herausforderungen.</p>
      </div>

      {overview.activeChallenge && (
        <section className="rounded-xl border border-aw-gold/30 bg-aw-gold/5 p-5">
          <h2 className="font-display text-lg font-bold text-aw-cream">Aktuelle Challenge</h2>
          <p className="mt-2 text-sm text-aw-muted">{overview.activeChallenge.title}</p>
          <Link
            href={`/community/challenges/${overview.activeChallenge.slug}`}
            className="mt-3 inline-flex text-sm font-semibold text-aw-gold"
          >
            Challenge ansehen →
          </Link>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="font-display text-lg font-bold text-aw-cream">Meine Beiträge</h2>
        {overview.submissions.length === 0 && (
          <p className="text-sm text-aw-muted">Noch keine Einreichungen.</p>
        )}
        {overview.submissions.map((entry) => (
          <article key={entry.id} className="rounded-xl border border-aw-border p-4">
            <h3 className="font-medium text-aw-cream">{entry.title}</h3>
            <p className="text-xs text-aw-muted">{entry.status}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
