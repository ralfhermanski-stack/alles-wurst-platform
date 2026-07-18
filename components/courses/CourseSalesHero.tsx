import Link from "next/link";

import Icon from "@/components/brand/Icon";
import CourseGroupLinks from "@/components/courses/CourseGroupLinks";
import CourseSalesPurchaseBox from "@/components/courses/CourseSalesPurchaseBox";
import {
  COURSE_TYPE_LABELS,
  formatCoursePrice,
} from "@/lib/courses/course-labels";
import { buildCourseSalesBenefits } from "@/lib/courses/course-sales-benefits";
import type { CourseSalesContext } from "@/lib/courses/course-sales-context";

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

function resolveHeroCta(context: CourseSalesContext): {
  href: string;
  label: string;
} {
  const { course, hasAccess, isLoggedIn, checkoutTarget } = context;
  const participantUrl = `/mein-bereich/kurse/${course.slug}`;

  if (hasAccess) {
    return { href: participantUrl, label: "Kurs starten" };
  }

  if (course.priceCents === 0) {
    return {
      href: isLoggedIn
        ? "/kontakt"
        : `/anmelden?next=${encodeURIComponent(participantUrl)}`,
      label: "Kostenlos starten",
    };
  }

  if (checkoutTarget) {
    const checkoutUrl = `/kaufen/${checkoutTarget.productSlug}`;

    return {
      href: isLoggedIn
        ? checkoutUrl
        : `/anmelden?next=${encodeURIComponent(checkoutUrl)}`,
      label: "Jetzt kaufen",
    };
  }

  return { href: "/kontakt", label: "Kauf anfragen" };
}

type CourseSalesHeroProps = {
  context: CourseSalesContext;
};

/**
 * Hero-Bereich der Verkaufsseite: Text links, ein Cover rechts (Desktop);
 * auf Mobil: Cover oben, dann Inhalt, dann Kaufbox.
 */
export default function CourseSalesHero({ context }: CourseSalesHeroProps) {
  const { course, isAdmin } = context;
  const benefits = buildCourseSalesBenefits(course);
  const priceLabel = formatCoursePrice(course.priceCents, course.priceCurrency);
  const duration = formatDuration(course.estimatedMinutes);
  const cta = resolveHeroCta(context);

  return (
    <section className="border-b border-aw-border bg-gradient-to-b from-aw-surface/80 to-aw-bg">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-16">
        <nav className="mb-6 text-sm text-aw-muted">
          <Link href="/akademie/kurse" className="hover:text-aw-gold">
            Kurse
          </Link>
          <span className="mx-2">/</span>
          <span className="text-aw-cream">{course.title}</span>
        </nav>

        {isAdmin && course.status !== "published" && (
          <p className="mb-4 rounded-lg border border-aw-warning/40 bg-aw-warning/10 px-4 py-2 text-sm text-aw-warning">
            Admin-Vorschau — dieser Kurs ist noch nicht veröffentlicht.
          </p>
        )}

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start lg:gap-12">
          {/* Cover — auf Mobil zuerst */}
          {course.hasCover && (
            <div className="order-1 lg:order-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/courses/covers/${course.id}`}
                alt={course.title}
                className="aspect-[4/3] w-full rounded-2xl border border-aw-border/80 object-cover shadow-[0_24px_48px_-20px_rgba(0,0,0,0.65)]"
              />
            </div>
          )}

          {/* Textinhalt */}
          <div className={`order-2 space-y-6 ${course.hasCover ? "lg:order-1" : "lg:col-span-2"}`}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-aw-gold">
                {COURSE_TYPE_LABELS[course.courseType]}
              </p>
              <h1 className="mt-3 font-display text-3xl font-bold leading-tight text-aw-cream sm:text-4xl lg:text-[2.75rem]">
                {course.title}
              </h1>
              {course.subtitle && (
                <p className="mt-3 text-lg text-aw-muted">{course.subtitle}</p>
              )}
              {course.shortDescription && (
                <p className="mt-4 text-lg leading-relaxed text-aw-cream/90">
                  {course.shortDescription}
                </p>
              )}
              <CourseGroupLinks
                group={course.group}
                subgroup={course.subgroup}
                className="mt-4"
              />
            </div>

            <ul className="space-y-2.5">
              {benefits.map((benefit) => (
                <li
                  key={benefit}
                  className="flex items-start gap-3 text-base text-aw-cream/90"
                >
                  <Icon
                    name="check"
                    className="mt-0.5 h-5 w-5 shrink-0 text-aw-gold"
                  />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>

            <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-aw-muted">
              {priceLabel && (
                <div>
                  <dt className="sr-only">Preis</dt>
                  <dd className="font-display text-2xl font-bold text-aw-gold">
                    {priceLabel}
                  </dd>
                </div>
              )}
              <div>
                <dt className="inline text-aw-muted">Module: </dt>
                <dd className="inline font-medium text-aw-cream">
                  {course.moduleCount}
                </dd>
              </div>
              <div>
                <dt className="inline text-aw-muted">Lektionen: </dt>
                <dd className="inline font-medium text-aw-cream">
                  {course.lessonCount}
                </dd>
              </div>
              {duration && (
                <div>
                  <dt className="inline text-aw-muted">Dauer: </dt>
                  <dd className="inline font-medium text-aw-cream">{duration}</dd>
                </div>
              )}
            </dl>

            <Link
              href={cta.href}
              className="inline-flex items-center justify-center rounded-lg bg-aw-gold px-8 py-3.5 text-sm font-semibold text-aw-bg transition-colors hover:bg-aw-gold-dark"
            >
              {cta.label}
            </Link>
          </div>
        </div>

        {/* Kaufbox — nur Mobil */}
        <div className="mt-8 lg:hidden">
          <CourseSalesPurchaseBox
            course={course}
            hasAccess={context.hasAccess}
            isLoggedIn={context.isLoggedIn}
            checkoutTarget={context.checkoutTarget}
            isAdmin={isAdmin}
          />
        </div>
      </div>
    </section>
  );
}
