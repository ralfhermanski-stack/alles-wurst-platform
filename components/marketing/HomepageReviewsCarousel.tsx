"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

import { getInitialsFromLabel } from "@/lib/users/public-user";
import type { PublicReviewEntry } from "@/lib/reviews/public-review-types";

type CarouselLabels = {
  previous: string;
  next: string;
  readMore: string;
  sourcePlatform: string;
  sourceCourse: string;
  reviewPositionPrefix: string;
};

type HomepageReviewsCarouselProps = {
  reviews: PublicReviewEntry[];
  labels: CarouselLabels;
};

const CONTENT_PREVIEW_LENGTH = 180;
const AUTOPLAY_MIN_MS = 6000;
const AUTOPLAY_MAX_MS = 8000;
const MANUAL_PAUSE_MS = 10_000;

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} von 5 Sternen`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <svg
          key={index}
          viewBox="0 0 24 24"
          className={`h-4 w-4 ${index < rating ? "text-aw-gold" : "text-aw-border"}`}
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 18.9 6.1 21l1.2-6.5L2.5 9.9l6.6-.9L12 2.5Z" />
        </svg>
      ))}
    </div>
  );
}

function formatMonthYear(iso: string): string {
  const date = new Date(iso);

  return date.toLocaleDateString("de-DE", {
    month: "long",
    year: "numeric",
  });
}

function getVisibleCount(width: number): number {
  if (width >= 1024) {
    return 3;
  }

  if (width >= 768) {
    return 2;
  }

  return 1;
}

function getNavThreshold(visible: number): number {
  return visible + 1;
}

function getAutoplayThreshold(visible: number): number {
  return visible + 2;
}

function ReviewCard({
  review,
  labels,
  onReadMore,
}: {
  review: PublicReviewEntry;
  labels: CarouselLabels;
  onReadMore: (review: PublicReviewEntry) => void;
}) {
  const initials = getInitialsFromLabel(review.displayName);
  const isLong = review.content.length > CONTENT_PREVIEW_LENGTH;
  const preview = isLong
    ? `${review.content.slice(0, CONTENT_PREVIEW_LENGTH).trim()}…`
    : review.content;
  const sourceLabel =
    review.source === "course" ? labels.sourceCourse : labels.sourcePlatform;

  return (
    <figure className="flex h-full min-h-[280px] flex-col rounded-2xl border border-aw-border bg-aw-surface p-6">
      <div className="flex items-start justify-between gap-3">
        <Stars rating={review.rating} />
        <p className="text-xs text-aw-muted">{formatMonthYear(review.publishedAt)}</p>
      </div>

      {review.title && (
        <p className="mt-3 text-sm font-semibold text-aw-cream">{review.title}</p>
      )}

      <blockquote className="mt-3 flex-1 text-sm leading-7 text-aw-cream/90">
        „{preview}“
      </blockquote>

      {isLong && (
        <button
          type="button"
          className="mt-2 self-start text-sm font-medium text-aw-gold hover:text-aw-cream"
          onClick={() => onReadMore(review)}
        >
          {labels.readMore}
        </button>
      )}

      <figcaption className="mt-6 flex items-center gap-3 border-t border-aw-border pt-5">
        {review.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={review.avatarUrl}
            alt=""
            className="h-11 w-11 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-aw-gold text-sm font-bold text-aw-bg"
            aria-hidden="true"
          >
            {initials}
          </span>
        )}
        <div>
          <p className="text-sm font-semibold text-aw-cream">{review.displayName}</p>
          {review.membershipLabel && (
            <p className="text-xs font-medium text-aw-gold">{review.membershipLabel}</p>
          )}
          <p className="text-xs text-aw-muted">
            {sourceLabel}
            {review.courseTitle ? ` · ${review.courseTitle}` : ""}
          </p>
        </div>
      </figcaption>
    </figure>
  );
}

export default function HomepageReviewsCarousel({
  reviews,
  labels,
}: HomepageReviewsCarouselProps) {
  const rootId = useId();
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(3);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [dialogReview, setDialogReview] = useState<PublicReviewEntry | null>(null);
  const pauseUntilRef = useRef(0);
  const touchStartX = useRef<number | null>(null);

  const total = reviews.length;
  const showNav = total >= getNavThreshold(visibleCount);
  const enableAutoplay =
    !reducedMotion && total >= getAutoplayThreshold(visibleCount);

  const updateVisibleCount = useCallback(() => {
    setVisibleCount(getVisibleCount(window.innerWidth));
  }, []);

  useEffect(() => {
    updateVisibleCount();
    window.addEventListener("resize", updateVisibleCount);

    return () => window.removeEventListener("resize", updateVisibleCount);
  }, [updateVisibleCount]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);

    return () => media.removeEventListener("change", update);
  }, []);

  const pause = useCallback((ms = MANUAL_PAUSE_MS) => {
    pauseUntilRef.current = Date.now() + ms;
  }, []);

  const goNext = useCallback(() => {
    setIndex((current) => (current + 1) % total);
  }, [total]);

  const goPrev = useCallback(() => {
    setIndex((current) => (current - 1 + total) % total);
  }, [total]);

  const handleManualNav = useCallback(
    (direction: "next" | "prev") => {
      pause();

      if (direction === "next") {
        goNext();
      } else {
        goPrev();
      }
    },
    [goNext, goPrev, pause],
  );

  useEffect(() => {
    if (!enableAutoplay || total <= visibleCount) {
      return;
    }

    const delay =
      AUTOPLAY_MIN_MS +
      Math.floor(Math.random() * (AUTOPLAY_MAX_MS - AUTOPLAY_MIN_MS));

    const timer = window.setInterval(() => {
      if (document.hidden) {
        return;
      }

      if (Date.now() < pauseUntilRef.current) {
        return;
      }

      goNext();
    }, delay);

    return () => window.clearInterval(timer);
  }, [enableAutoplay, goNext, total, visibleCount, index]);

  useEffect(() => {
    if (index > Math.max(0, total - visibleCount)) {
      setIndex(0);
    }
  }, [index, total, visibleCount]);

  if (total === 0) {
    return null;
  }

  const maxIndex = Math.max(0, total - visibleCount);
  const clampedIndex = Math.min(index, maxIndex);
  const slidePercent = 100 / visibleCount;

  return (
    <div
      className="relative mt-12"
      onMouseEnter={() => pause()}
      onFocusCapture={() => pause()}
      onTouchStart={() => pause()}
    >
      <div className="overflow-hidden" id={`${rootId}-viewport`}>
        <div
          ref={trackRef}
          className="flex transition-transform duration-500 ease-out motion-reduce:transition-none"
          style={{
            transform: `translateX(-${clampedIndex * slidePercent}%)`,
          }}
          aria-live="polite"
          onTouchStart={(event) => {
            touchStartX.current = event.touches[0]?.clientX ?? null;
            pause();
          }}
          onTouchEnd={(event) => {
            const start = touchStartX.current;

            if (start === null) {
              return;
            }

            const end = event.changedTouches[0]?.clientX ?? start;
            const delta = end - start;

            if (Math.abs(delta) > 40) {
              if (delta < 0) {
                handleManualNav("next");
              } else {
                handleManualNav("prev");
              }
            }

            touchStartX.current = null;
          }}
        >
          {reviews.map((review) => (
            <div
              key={`${review.source}-${review.id}`}
              className="shrink-0 px-3"
              style={{ width: `${slidePercent}%` }}
            >
              <ReviewCard
                review={review}
                labels={labels}
                onReadMore={setDialogReview}
              />
            </div>
          ))}
        </div>
      </div>

      {showNav && (
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            type="button"
            className="rounded-full border border-aw-border px-4 py-2 text-sm text-aw-cream hover:border-aw-gold hover:text-aw-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aw-gold"
            onClick={() => handleManualNav("prev")}
            aria-label={labels.previous}
            aria-controls={`${rootId}-viewport`}
          >
            ←
          </button>
          <p className="text-sm text-aw-muted" aria-live="polite">
            {labels.reviewPositionPrefix} {clampedIndex + 1} von {total}
          </p>
          <button
            type="button"
            className="rounded-full border border-aw-border px-4 py-2 text-sm text-aw-cream hover:border-aw-gold hover:text-aw-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aw-gold"
            onClick={() => handleManualNav("next")}
            aria-label={labels.next}
            aria-controls={`${rootId}-viewport`}
          >
            →
          </button>
        </div>
      )}

      {dialogReview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${rootId}-dialog-title`}
          onClick={() => setDialogReview(null)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setDialogReview(null);
            }
          }}
        >
          <div
            className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-aw-border bg-aw-surface p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <h3
              id={`${rootId}-dialog-title`}
              className="font-display text-xl font-bold text-aw-cream"
            >
              {dialogReview.displayName}
            </h3>
            <div className="mt-3">
              <Stars rating={dialogReview.rating} />
            </div>
            <p className="mt-4 text-sm leading-7 text-aw-cream/90">
              „{dialogReview.content}“
            </p>
            <button
              type="button"
              className="mt-6 rounded-lg border border-aw-border px-4 py-2 text-sm text-aw-cream hover:border-aw-gold"
              onClick={() => setDialogReview(null)}
            >
              Schließen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
