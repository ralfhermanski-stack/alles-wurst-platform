import ChallengePreviewCard from "@/components/cards/ChallengePreviewCard";
import SocialPlatformCard from "@/components/cards/SocialPlatformCard";
import PlatformText from "@/components/platform-text/PlatformText";
import { getHomepageChallengeData } from "@/lib/challenges/challenge-service";
import { getHomepageSocialCards } from "@/lib/social-media/social-media-homepage-service";
import { getSessionUserIdFromCookies } from "@/lib/auth/session";
import { checkChallengeEligibility } from "@/lib/challenges/challenge-eligibility";

function socialCardsLayoutClass(count: number): string {
  if (count <= 1) {
    return "mx-auto max-w-3xl";
  }
  if (count === 2) {
    return "mx-auto grid max-w-3xl gap-6 sm:grid-cols-2";
  }
  if (count === 3) {
    return "mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3";
  }
  return "grid gap-6 sm:grid-cols-2 xl:grid-cols-4";
}

export default async function HomepageCommunitySocialSection() {
  const userId = await getSessionUserIdFromCookies();
  const [socialCards, challengeData] = await Promise.all([
    getHomepageSocialCards(),
    getHomepageChallengeData(6),
  ]);

  const canParticipate =
    challengeData.challenge && userId
      ? (await checkChallengeEligibility(userId, {
          eligibilityConfig: challengeData.challenge.eligibilityConfig,
        })).eligible
      : false;

  const singleChannel = socialCards.length === 1;

  return (
    <section className="border-t border-aw-border bg-aw-surface/40">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <PlatformText
            textKey="homepage.social.eyebrow"
            elementType="subheading"
            as="p"
            className="text-xs font-medium uppercase tracking-[0.25em] text-aw-gold"
            fallback="Community"
          />
          <h2 className="mt-2 font-display text-3xl font-bold text-aw-cream">
            <PlatformText
              textKey="homepage.social.title"
              elementType="heading"
              as="span"
              fallback="Werde Teil der Alles-Wurst Community"
            />
          </h2>
          <PlatformText
            textKey="homepage.social.subtitle"
            elementType="text"
            as="p"
            className="mt-4 text-base leading-7 text-aw-muted"
            fallback="Folge uns auf Social Media für Inspiration aus der Werkstatt."
          />
        </div>

        {socialCards.length > 0 ? (
          <div className={`mt-12 ${socialCardsLayoutClass(socialCards.length)}`}>
            {socialCards.map((platform) => (
              <SocialPlatformCard
                key={platform.id}
                platform={platform}
                variant={singleChannel ? "spotlight" : "card"}
              />
            ))}
          </div>
        ) : (
          <p className="mt-12 text-center text-sm text-aw-muted">
            <PlatformText
              textKey="homepage.social.unavailable"
              elementType="text"
              as="span"
              fallback="Social-Media-Kanäle werden in Kürze hier angezeigt."
            />
          </p>
        )}

        {challengeData.challenge && (
          <div className="mt-16">
            <ChallengePreviewCard
              challenge={challengeData.challenge}
              approvedSubmissions={challengeData.approvedSubmissions}
              participantCount={challengeData.participantCount}
              canParticipate={canParticipate}
              isLoggedIn={Boolean(userId)}
            />
          </div>
        )}
      </div>
    </section>
  );
}
