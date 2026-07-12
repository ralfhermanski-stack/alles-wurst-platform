import HomepageReviewsCarousel from "@/components/marketing/HomepageReviewsCarousel";
import { getPlatformText } from "@/lib/platform-text/platform-text-service";
import { getPublicHomepageReviews } from "@/lib/reviews/public-review-service";

function formatGermanNumber(value: number): string {
  return value.toLocaleString("de-DE");
}

export default async function HomepageCommunityReviewsSection() {
  const payload = await getPublicHomepageReviews();

  if (payload.reviews.length === 0 && payload.emptyStateMode === "hidden") {
    return null;
  }

  const textVars: Record<string, string> = {};

  if (payload.stats.memberCount !== null) {
    textVars.memberCount = formatGermanNumber(payload.stats.memberCount);
  } else {
    textVars.memberCount = "";
  }

  textVars.reviewCount = formatGermanNumber(payload.stats.reviewCount);

  if (payload.stats.averageRating !== null) {
    textVars.averageRating = payload.stats.averageRating.toLocaleString("de-DE", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
  } else {
    textVars.averageRating = "";
  }

  const [
    eyebrow,
    title,
    subtitle,
    emptyTitle,
    emptyDescription,
    previous,
    next,
    readMore,
    sourcePlatform,
    sourceCourse,
  ] = await Promise.all([
    getPlatformText("homepage.reviews.eyebrow", "Stimmen aus der Community"),
    getPlatformText("homepage.reviews.title", "Was unsere Mitglieder sagen"),
    getPlatformText(
      "homepage.reviews.subtitle",
      "Bereits {{memberCount}} Wurstfreunde lernen und tüfteln mit Alles Wurst.",
      textVars,
    ),
    getPlatformText(
      "homepage.reviews.empty.title",
      "Noch keine Bewertungen",
    ),
    getPlatformText(
      "homepage.reviews.empty.description",
      "Dieser Bereich wird mit den ersten freigegebenen Bewertungen unserer Mitglieder gefüllt.",
    ),
    getPlatformText("homepage.reviews.previous", "Vorherige Bewertung"),
    getPlatformText("homepage.reviews.next", "Nächste Bewertung"),
    getPlatformText("homepage.reviews.readMore", "Weiterlesen"),
    getPlatformText("homepage.reviews.source.platform", "Plattform"),
    getPlatformText("homepage.reviews.source.course", "Kurs"),
  ]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-aw-gold">
          {eyebrow}
        </p>
        <h2 className="mt-2 font-display text-3xl font-bold text-aw-cream">
          {title}
        </h2>
        {subtitle.trim() && (
          <p className="mt-4 text-base leading-7 text-aw-muted">{subtitle}</p>
        )}
        {payload.stats.averageRating !== null && (
          <p className="mt-2 text-sm text-aw-gold">
            {payload.stats.averageRating.toLocaleString("de-DE", {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })}{" "}
            von 5 Sternen aus {formatGermanNumber(payload.stats.reviewCount)}{" "}
            Bewertungen
          </p>
        )}
      </div>

      {payload.reviews.length === 0 ? (
        <div className="mx-auto mt-12 max-w-xl rounded-2xl border border-aw-border bg-aw-surface/40 p-8 text-center">
          <h3 className="font-display text-lg font-semibold text-aw-cream">
            {emptyTitle}
          </h3>
          <p className="mt-3 text-sm leading-7 text-aw-muted">{emptyDescription}</p>
        </div>
      ) : (
        <HomepageReviewsCarousel
          reviews={payload.reviews}
          labels={{
            previous,
            next,
            readMore,
            sourcePlatform,
            sourceCourse,
            reviewPositionPrefix: "Bewertung",
          }}
        />
      )}
    </section>
  );
}
