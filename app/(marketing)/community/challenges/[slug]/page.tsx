import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import PageHeader from "@/components/marketing/PageHeader";
import { getChallengeBySlug } from "@/lib/challenges/challenge-service";
import { listApprovedSubmissions } from "@/lib/challenges/challenge-submission-service";
import { getSessionUserIdFromCookies } from "@/lib/auth/session";
import { checkChallengeEligibility } from "@/lib/challenges/challenge-eligibility";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const challenge = await getChallengeBySlug(slug);

  if (!challenge) {
    return {};
  }

  return {
    title: challenge.title,
    robots: challenge.isTestData ? { index: false, follow: false } : undefined,
  };
}

export default async function ChallengeDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const userId = await getSessionUserIdFromCookies();
  const challenge = await getChallengeBySlug(slug);

  if (!challenge || challenge.status === "DRAFT" || challenge.status === "ARCHIVED") {
    notFound();
  }

  const [submissions, eligibility] = await Promise.all([
    listApprovedSubmissions(challenge.id, 12),
    checkChallengeEligibility(userId, {
      eligibilityConfig: challenge.eligibilityConfig,
    }),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Wurst-Challenge"
        title={challenge.title}
        description={challenge.excerpt ?? undefined}
      />

      <section className="mx-auto max-w-4xl space-y-8 px-4 py-16 sm:px-6">
        <div className="prose prose-invert max-w-none text-sm leading-7 text-aw-cream/90">
          <p>{challenge.description}</p>
          <h2 className="font-display text-lg font-bold text-aw-cream">Aufgabenstellung</h2>
          <p>{challenge.task}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          {eligibility.eligible && (
            <Link
              href={`/community/challenges/${slug}/teilnehmen`}
              className="inline-flex rounded-md bg-aw-gold px-5 py-2.5 text-sm font-semibold text-aw-bg"
            >
              Jetzt teilnehmen
            </Link>
          )}
          {!userId && (
            <Link
              href={`/anmelden?next=${encodeURIComponent(`/community/challenges/${slug}/teilnehmen`)}`}
              className="inline-flex rounded-md px-5 py-2.5 text-sm font-semibold text-aw-cream ring-1 ring-aw-border"
            >
              Anmelden & teilnehmen
            </Link>
          )}
        </div>

        {submissions.length > 0 && (
          <div>
            <h2 className="font-display text-lg font-bold text-aw-cream">Freigegebene Beiträge</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {submissions.map((entry) => (
                <article key={entry.id} className="rounded-xl border border-aw-border p-4">
                  <h3 className="font-medium text-aw-cream">{entry.title}</h3>
                  <p className="mt-1 text-xs text-aw-muted">{entry.displayName}</p>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>
    </>
  );
}
