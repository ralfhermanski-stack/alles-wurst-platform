import { redirect, notFound } from "next/navigation";

import ChallengeParticipationForm from "@/components/challenges/ChallengeParticipationForm";
import PageHeader from "@/components/marketing/PageHeader";
import { getChallengeBySlug } from "@/lib/challenges/challenge-service";
import { getUserSubmission } from "@/lib/challenges/challenge-submission-service";
import { checkChallengeEligibility } from "@/lib/challenges/challenge-eligibility";
import { getSessionUserIdFromCookies } from "@/lib/auth/session";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ChallengeParticipatePage({ params }: PageProps) {
  const { slug } = await params;
  const userId = await getSessionUserIdFromCookies();

  if (!userId) {
    redirect(`/anmelden?next=${encodeURIComponent(`/community/challenges/${slug}/teilnehmen`)}`);
  }

  const challenge = await getChallengeBySlug(slug);

  if (!challenge || !["ACTIVE", "VOTING"].includes(challenge.status)) {
    notFound();
  }

  const eligibility = await checkChallengeEligibility(userId, {
    eligibilityConfig: challenge.eligibilityConfig,
  });

  if (!eligibility.eligible) {
    return (
      <>
        <PageHeader title={challenge.title} description={eligibility.reason ?? undefined} />
        <section className="mx-auto max-w-2xl px-4 py-16 text-center text-sm text-aw-muted">
          {eligibility.reason}
        </section>
      </>
    );
  }

  const existing = await getUserSubmission(challenge.id, userId);

  return (
    <>
      <PageHeader
        eyebrow="Teilnahme"
        title={challenge.title}
        description="Reiche deinen Beitrag für die Challenge ein."
      />
      <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <ChallengeParticipationForm challenge={challenge} initialSubmission={existing} />
      </section>
    </>
  );
}
