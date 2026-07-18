import Link from "next/link";

import Icon from "@/components/brand/Icon";
import {
  COURSE_TYPE_LABELS,
  formatCoursePrice,
} from "@/lib/courses/course-labels";
import type { CourseSummary } from "@/lib/courses/course-types";

function formatDuration(estimatedMinutes: number | null): string | null {
  if (!estimatedMinutes || estimatedMinutes <= 0) {
    return null;
  }

  if (estimatedMinutes < 60) {
    return `${estimatedMinutes} Min.`;
  }

  const hours = Math.round((estimatedMinutes / 60) * 10) / 10;

  return `ca. ${hours} Std.`;
}

/**
 * Kurskarte für Katalog und Startseite.
 * Zeigt Coverbild (oder Fallback), Titel, Kurzbeschreibung, Preis,
 * Kurstyp, Dauer, CTA und optional ein „Empfohlen“-Badge.
 */
export default function CourseCatalogCard({ course }: { course: CourseSummary }) {
  const priceLabel = formatCoursePrice(course.priceCents, course.priceCurrency);
  const duration = formatDuration(course.estimatedMinutes);

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-aw-border bg-aw-surface transition-all hover:-translate-y-1 hover:border-aw-gold/50 hover:shadow-[0_18px_40px_-24px_rgba(212,175,55,0.5)]">
      <div className="relative h-40 overflow-hidden">
        {course.hasCover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/courses/covers/${course.id}`}
            alt={course.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-aw-brown/50 to-aw-bg">
            <Icon name="sausage" className="h-16 w-16 text-aw-cream/10" />
          </div>
        )}

        <span className="absolute left-3 top-3 rounded-full bg-aw-bg/70 px-2 py-1 text-xs text-aw-muted backdrop-blur-sm">
          {COURSE_TYPE_LABELS[course.courseType]}
        </span>

        {course.featuredOnHomepage && (
          <span className="absolute right-3 top-3 rounded-full bg-aw-gold px-2.5 py-1 text-xs font-semibold text-aw-bg">
            Empfohlen
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-lg font-bold text-aw-cream">
          {course.title}
        </h3>

        {course.shortDescription && (
          <p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-aw-muted">
            {course.shortDescription}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between text-xs text-aw-muted">
          <span>
            {duration ?? `${course.lessonCount} Lektionen`}
          </span>
          {priceLabel && (
            <span className="font-semibold text-aw-gold">{priceLabel}</span>
          )}
        </div>

        <Link
          href={`/akademie/kurse/${encodeURIComponent(course.slug)}`}
          className="mt-4 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold text-aw-gold ring-1 ring-aw-gold/40 transition-colors group-hover:bg-aw-gold group-hover:text-aw-bg"
        >
          Kurs ansehen
        </Link>
      </div>
    </article>
  );
}
