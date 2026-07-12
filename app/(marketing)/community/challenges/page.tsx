import Link from "next/link";

import PageHeader from "@/components/marketing/PageHeader";
import { listPublicChallenges } from "@/lib/challenges/challenge-service";

export default async function ChallengesOverviewPage() {
  const challenges = await listPublicChallenges();

  return (
    <>
      <PageHeader
        eyebrow="Community"
        title="Wurst-Challenges"
        description="Monatliche Herausforderungen für alle Wurst-Enthusiasten."
      />

      <section className="mx-auto max-w-4xl space-y-4 px-4 py-16 sm:px-6">
        {challenges.length === 0 && (
          <p className="text-sm text-aw-muted">Aktuell keine Challenges verfügbar.</p>
        )}

        {challenges.map((challenge) => (
          <article
            key={challenge.id}
            className="rounded-2xl border border-aw-border bg-aw-surface/40 p-6"
          >
            <h2 className="font-display text-xl font-bold text-aw-cream">
              <Link href={`/community/challenges/${challenge.slug}`} className="hover:text-aw-gold">
                {challenge.title}
              </Link>
            </h2>
            {challenge.excerpt && (
              <p className="mt-2 text-sm text-aw-muted">{challenge.excerpt}</p>
            )}
          </article>
        ))}
      </section>
    </>
  );
}
