import Link from "next/link";

import Icon from "@/components/brand/Icon";
import PlatformText from "@/components/platform-text/PlatformText";
import type {
  ChallengeEntry,
  ChallengeSubmissionPreview,
} from "@/lib/challenges/challenge-types";

type ChallengePreviewCardProps = {
  challenge: ChallengeEntry;
  approvedSubmissions: ChallengeSubmissionPreview[];
  participantCount: number;
  canParticipate: boolean;
  isLoggedIn: boolean;
};

function formatPeriod(startAt: string, endAt: string): string {
  const formatter = new Intl.DateTimeFormat("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return `${formatter.format(new Date(startAt))} – ${formatter.format(new Date(endAt))}`;
}

export default function ChallengePreviewCard({
  challenge,
  approvedSubmissions,
  participantCount,
  canParticipate,
  isLoggedIn,
}: ChallengePreviewCardProps) {
  const challengeHref = `/community/challenges/${challenge.slug}`;

  return (
    <article className="overflow-hidden rounded-2xl border border-aw-gold/30 bg-gradient-to-b from-aw-gold/10 to-aw-surface">
      <div className="grid gap-0 lg:grid-cols-[1.1fr_1fr]">
        <div className="flex flex-col justify-between p-6 sm:p-8">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-aw-gold/15 px-3 py-1 text-xs font-semibold text-aw-gold ring-1 ring-aw-gold/30">
              <Icon name="flame" className="h-3.5 w-3.5" />
              <PlatformText
                textKey="homepage.challenge.badge"
                elementType="text"
                as="span"
                fallback="Wurst-Challenge des Monats"
              />
            </span>
            <h3 className="mt-5 font-display text-2xl font-bold text-aw-cream sm:text-3xl">
              {challenge.title}
            </h3>
            <p className="mt-3 text-sm leading-7 text-aw-muted sm:text-base">
              {challenge.excerpt ?? challenge.description.slice(0, 200)}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-6 text-sm">
            <div>
              <p className="font-display text-2xl font-bold text-aw-gold">
                {participantCount.toLocaleString("de-DE")}
              </p>
              <p className="text-xs text-aw-muted">Teilnehmer</p>
            </div>
            <div>
              <p className="font-semibold text-aw-cream">
                {formatPeriod(challenge.startAt, challenge.endAt)}
              </p>
              <p className="text-xs text-aw-muted">Zeitraum</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={challengeHref}
              className="inline-flex rounded-md bg-aw-gold px-5 py-2.5 text-sm font-semibold text-aw-bg hover:bg-aw-gold-dark"
            >
              <PlatformText
                textKey="homepage.challenge.view"
                elementType="button"
                as="span"
                fallback="Challenge ansehen"
              />
            </Link>
            {canParticipate && (
              <Link
                href={`${challengeHref}/teilnehmen`}
                className="inline-flex rounded-md px-5 py-2.5 text-sm font-semibold text-aw-cream ring-1 ring-aw-border hover:bg-aw-surface-2"
              >
                <PlatformText
                  textKey="homepage.challenge.participate"
                  elementType="button"
                  as="span"
                  fallback="Jetzt teilnehmen"
                />
              </Link>
            )}
            {!isLoggedIn && (
              <Link
                href={`/anmelden?next=${encodeURIComponent(`${challengeHref}/teilnehmen`)}`}
                className="inline-flex rounded-md px-5 py-2.5 text-sm font-semibold text-aw-cream ring-1 ring-aw-border hover:bg-aw-surface-2"
              >
                Anmelden & teilnehmen
              </Link>
            )}
          </div>
        </div>

        <div className="border-t border-aw-border/60 bg-aw-bg/40 p-6 sm:p-8 lg:border-l lg:border-t-0">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-aw-gold">
            Bisherige Beiträge
          </p>

          {approvedSubmissions.length > 0 ? (
            <div className="mt-4 grid grid-cols-3 gap-3">
              {approvedSubmissions.slice(0, 6).map((entry) => (
                <div key={entry.id} className="group/entry">
                  <div className="relative aspect-square overflow-hidden rounded-lg ring-1 ring-aw-border transition-all group-hover/entry:ring-aw-gold/40">
                    {entry.previewImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={entry.previewImageUrl}
                        alt={entry.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-aw-surface">
                        <Icon name="sausage" className="h-8 w-8 text-aw-cream/10" />
                      </div>
                    )}
                  </div>
                  <p className="mt-1.5 truncate text-[11px] text-aw-muted">
                    {entry.displayName}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm leading-6 text-aw-muted">
              <PlatformText
                textKey="homepage.challenge.firstSubmission"
                elementType="text"
                as="span"
                fallback="Sei der Erste und reiche deinen Beitrag ein."
              />
            </p>
          )}
        </div>
      </div>

      <div
        className="relative h-2 bg-gradient-to-r from-aw-gold/25 via-aw-gold/40 to-aw-brown/40"
        aria-hidden="true"
      />
    </article>
  );
}
