import StarRating, { ReviewAvatar } from "@/components/courses/StarRating";
import type { CourseReviewSummary } from "@/lib/reviews/course-review-types";

type CourseSalesReviewsProps = {
  summary: CourseReviewSummary;
};

export default function CourseSalesReviews({ summary }: CourseSalesReviewsProps) {
  if (summary.reviewCount === 0) {
    return null;
  }

  return (
    <section>
      <h2 className="font-display text-2xl font-bold text-aw-cream sm:text-3xl">
        Bewertungen von Teilnehmern
      </h2>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <p className="font-display text-4xl font-bold text-aw-gold">
          {summary.averageRating?.toFixed(1).replace(".", ",")}
        </p>
        <div>
          <StarRating value={Math.round(summary.averageRating ?? 0)} />
          <p className="mt-1 text-sm text-aw-muted">
            {summary.reviewCount}{" "}
            {summary.reviewCount === 1 ? "Bewertung" : "Bewertungen"}
          </p>
        </div>
      </div>

      {summary.reviews.length > 0 && (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {summary.reviews.map((review) => (
            <article
              key={review.id}
              className="rounded-xl border border-aw-border bg-aw-surface/40 p-5"
            >
              <div className="flex items-start gap-3">
                <ReviewAvatar
                  displayName={review.displayName}
                  avatarUrl={review.avatarUrl}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-aw-cream">{review.displayName}</p>
                  <StarRating value={review.rating} size="sm" />
                </div>
              </div>
              {review.reviewText && (
                <p className="mt-3 text-sm leading-relaxed text-aw-cream/85">
                  {review.reviewText}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
