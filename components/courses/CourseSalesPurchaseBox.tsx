import Link from "next/link";

import {
  COURSE_TYPE_LABELS,
  formatCoursePrice,
} from "@/lib/courses/course-labels";
import {
  formatCourseProofLabel,
  hasCourseProof,
} from "@/lib/courses/course-sales-benefits";
import type { CourseCheckoutTarget } from "@/lib/courses/course-catalog-service";
import type { CourseDetail } from "@/lib/courses/course-types";

type CourseSalesPurchaseBoxProps = {
  course: CourseDetail;
  hasAccess: boolean;
  isLoggedIn: boolean;
  checkoutTarget: CourseCheckoutTarget | null;
  isAdmin?: boolean;
};

function formatDuration(estimatedMinutes: number | null): string | null {
  if (!estimatedMinutes || estimatedMinutes <= 0) {
    return null;
  }

  if (estimatedMinutes < 60) {
    return `${estimatedMinutes} Minuten`;
  }

  const hours = Math.round((estimatedMinutes / 60) * 10) / 10;

  return `ca. ${hours} Stunden`;
}

function resolvePrimaryCta(props: CourseSalesPurchaseBoxProps): {
  href: string;
  label: string;
  disabled?: boolean;
  hint?: string;
} {
  const { course, hasAccess, isLoggedIn, checkoutTarget } = props;
  const participantUrl = `/mein-bereich/kurse/${course.slug}`;
  const isFree = course.priceCents === 0;

  if (hasAccess) {
    return { href: participantUrl, label: "Kurs starten" };
  }

  if (isFree) {
    if (!isLoggedIn) {
      return {
        href: `/anmelden?next=${encodeURIComponent(participantUrl)}`,
        label: "Kostenlos starten",
        hint: "Melde dich an, um den Kurs zu beginnen.",
      };
    }

    return {
      href: "/kontakt",
      label: "Zugang anfragen",
      hint: "Nach Freischaltung kannst du den Kurs in deinem Bereich starten.",
    };
  }

  if (checkoutTarget) {
    const checkoutUrl = `/kaufen/${checkoutTarget.productSlug}`;

    if (!isLoggedIn) {
      return {
        href: `/anmelden?next=${encodeURIComponent(checkoutUrl)}`,
        label: "Jetzt kaufen",
        hint: "Melde dich an, um den Kauf abzuschließen.",
      };
    }

    return { href: checkoutUrl, label: "Jetzt kaufen" };
  }

  return {
    href: "/kontakt",
    label: "Kauf anfragen",
    hint: "Der Checkout wird gerade eingerichtet. Wir helfen dir gerne weiter.",
  };
}

/**
 * Sticky Kaufbox für die Verkaufsseite (ohne Cover — das Cover steht nur im Hero).
 */
export default function CourseSalesPurchaseBox(props: CourseSalesPurchaseBoxProps) {
  const { course, hasAccess, isAdmin, checkoutTarget } = props;
  const priceLabel = formatCoursePrice(course.priceCents, course.priceCurrency);
  const duration = formatDuration(course.estimatedMinutes);
  const cta = resolvePrimaryCta(props);
  const proofLabel = formatCourseProofLabel(course.certificateType, course.courseType);
  const showProof = hasCourseProof(course.certificateType, course.courseType);

  return (
    <aside className="rounded-2xl border border-aw-border bg-aw-surface p-6 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.6)] lg:sticky lg:top-24">
      {course.featuredOnHomepage && (
        <span className="mb-4 inline-block rounded-full bg-aw-gold/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-aw-gold">
          Empfohlen
        </span>
      )}

      {priceLabel && (
        <p className="font-display text-3xl font-bold text-aw-gold">{priceLabel}</p>
      )}

      <p className="mt-2 text-sm text-aw-muted">{COURSE_TYPE_LABELS[course.courseType]}</p>

      <ul className="mt-5 space-y-2.5 border-t border-aw-border pt-5 text-sm text-aw-muted">
        {duration && (
          <li className="flex justify-between gap-4">
            <span>Dauer</span>
            <span className="font-medium text-aw-cream">{duration}</span>
          </li>
        )}
        <li className="flex justify-between gap-4">
          <span>Module</span>
          <span className="font-medium text-aw-cream">{course.moduleCount}</span>
        </li>
        <li className="flex justify-between gap-4">
          <span>Lektionen</span>
          <span className="font-medium text-aw-cream">{course.lessonCount}</span>
        </li>
        {showProof && proofLabel && (
          <li className="flex justify-between gap-4">
            <span>Abschlussnachweis</span>
            <span className="font-medium text-aw-cream">{proofLabel}</span>
          </li>
        )}
      </ul>

      <Link
        href={cta.href}
        className="mt-6 flex w-full items-center justify-center rounded-lg bg-aw-gold px-6 py-3.5 text-sm font-semibold text-aw-bg transition-colors hover:bg-aw-gold-dark hover:text-aw-cream"
      >
        {cta.label}
      </Link>

      {cta.hint && (
        <p className="mt-3 text-center text-xs text-aw-muted">{cta.hint}</p>
      )}

      {hasAccess && (
        <p className="mt-3 text-center text-xs text-aw-success">
          Du hast bereits Zugang zu diesem Kurs.
        </p>
      )}

      {!hasAccess && course.priceCents !== null && course.priceCents > 0 && checkoutTarget && (
        <p className="mt-3 text-center text-xs text-aw-muted">
          Sichere Zahlung über unseren Checkout
        </p>
      )}

      {isAdmin && (
        <div className="mt-4 space-y-2 border-t border-aw-border pt-4">
          <p className="text-xs font-semibold text-aw-gold">Admin-Vorschau</p>
          <Link
            href={`/admin/kurse/${course.id}/vorschau`}
            className="block text-center text-xs text-aw-muted hover:text-aw-cream"
          >
            Vollständige Vorschau →
          </Link>
          <Link
            href={`/admin/kurse/${course.id}`}
            className="block text-center text-xs text-aw-muted hover:text-aw-cream"
          >
            Im Editor bearbeiten →
          </Link>
        </div>
      )}
    </aside>
  );
}
