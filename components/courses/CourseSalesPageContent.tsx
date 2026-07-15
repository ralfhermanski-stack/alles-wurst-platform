import Link from "next/link";
import type { ReactNode } from "react";

import Icon from "@/components/brand/Icon";
import CourseSalesCurriculum from "@/components/courses/CourseSalesCurriculum";
import CourseSalesHero from "@/components/courses/CourseSalesHero";
import CourseSalesPurchaseBox from "@/components/courses/CourseSalesPurchaseBox";
import CourseSalesReviews from "@/components/courses/CourseSalesReviews";
import CourseWorkshopProductLinks from "@/components/courses/CourseWorkshopProductLinks";
import Markdown from "@/components/ui/Markdown";
import {
  formatCourseProofLabel,
  hasCourseProof,
} from "@/lib/courses/course-sales-benefits";
import type { CourseSalesContext } from "@/lib/courses/course-sales-context";

function targetAudienceText(course: CourseSalesContext["course"]): string {
  if (course.courseType === "zertifikatskurs") {
    return "Für ambitionierte Hobby-Metzger und Fleischverarbeiter, die ihr Handwerk vertiefen und einen offiziellen Abschlussnachweis erwerben möchten.";
  }

  return "Für Einsteiger und Fortgeschrittene, die Wursthandwerk strukturiert und praxisnah erlernen möchten.";
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-display text-2xl font-bold text-aw-cream sm:text-3xl">
      {children}
    </h2>
  );
}

/**
 * Verkaufsfördernde Kursdetailseite — Hero, Inhalte in Verkaufsreihenfolge, Sticky-Kaufbox.
 */
export default function CourseSalesPageContent({
  context,
}: {
  context: CourseSalesContext;
}) {
  const { course, hasAccess, isLoggedIn, isAdmin, checkoutTarget, instructor, reviewSummary, workshopProducts } =
    context;

  const proofLabel = formatCourseProofLabel(course.certificateType, course.courseType);
  const showProof = hasCourseProof(course.certificateType, course.courseType);

  const purchaseBox = (
    <CourseSalesPurchaseBox
      course={course}
      hasAccess={hasAccess}
      isLoggedIn={isLoggedIn}
      checkoutTarget={checkoutTarget}
      isAdmin={isAdmin}
    />
  );

  return (
    <div className="bg-aw-bg">
      <CourseSalesHero context={context} />

      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-14 lg:grid-cols-[1fr_340px] lg:gap-16">
          <div className="min-w-0 space-y-16">
            {/* Ausführliche Beschreibung — große, gut lesbare Typografie */}
            {course.description && (
              <section className="max-w-3xl">
                <Markdown content={course.description} variant="sales" />
              </section>
            )}

            {/* 2. Das lernst du im Kurs */}
            {course.learningGoals.length > 0 && (
              <section>
                <SectionHeading>Das lernst du im Kurs</SectionHeading>
                <ul className="mt-6 space-y-4">
                  {course.learningGoals.map((goal) => (
                    <li
                      key={goal}
                      className="flex items-start gap-3 text-lg leading-relaxed text-aw-cream/85"
                    >
                      <Icon
                        name="check"
                        className="mt-1 h-5 w-5 shrink-0 text-aw-gold"
                      />
                      <span>{goal}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* 3. Für wen ist dieser Kurs geeignet? */}
            <section className="max-w-3xl">
              <SectionHeading>Für wen ist dieser Kurs geeignet?</SectionHeading>
              <p className="mt-6 text-lg leading-[1.75] text-aw-cream/85">
                {targetAudienceText(course)}
              </p>
            </section>

            {/* 4. Voraussetzungen */}
            {course.prerequisites?.trim() && (
              <section className="max-w-3xl">
                <SectionHeading>Voraussetzungen</SectionHeading>
                <Markdown
                  content={course.prerequisites}
                  variant="sales"
                  className="mt-6"
                />
              </section>
            )}

            {/* 5. Was du zuhause benötigst */}
            {(course.requiredEquipment?.trim() || workshopProducts.length > 0) && (
              <section className="max-w-3xl">
                <SectionHeading>Was du zuhause benötigst</SectionHeading>
                {course.requiredEquipment?.trim() && (
                  <Markdown
                    content={course.requiredEquipment}
                    variant="sales"
                    className="mt-6"
                  />
                )}
                <CourseWorkshopProductLinks products={workshopProducts} />
              </section>
            )}

            {/* 6. Lehrplan */}
            {course.modules.length > 0 && (
              <section>
                <SectionHeading>Lehrplan</SectionHeading>
                <p className="mt-3 text-base text-aw-muted">
                  {course.moduleCount} Module · {course.lessonCount} Lektionen —
                  Lektionstitel als Vorschau, volle Inhalte nach dem Kauf.
                </p>
                <div className="mt-6">
                  <CourseSalesCurriculum modules={course.modules} />
                </div>
              </section>
            )}

            {/* 7. Teilnahmeurkunde / Zertifikat */}
            {showProof && proofLabel && (
              <section className="max-w-3xl rounded-2xl border border-aw-gold/25 bg-gradient-to-r from-aw-gold/10 via-aw-surface to-aw-surface p-8 sm:p-10">
                <SectionHeading>{proofLabel} inklusive</SectionHeading>
                <p className="mt-4 text-lg leading-[1.75] text-aw-cream/85">
                  Nach erfolgreichem Kursabschluss erhältst du ein offizielles
                  Alles-Wurst-Dokument ({proofLabel}) — hochwertig gestaltet und
                  verifizierbar.
                </p>
              </section>
            )}

            <CourseSalesReviews summary={reviewSummary} />

            {/* 8. Dozent */}
            <section className="max-w-3xl rounded-2xl border border-aw-border bg-aw-surface/40 p-8 sm:p-10">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-aw-gold">
                Dein Dozent
              </p>
              <h2 className="mt-3 font-display text-2xl font-bold text-aw-cream sm:text-3xl">
                {instructor.name}
              </h2>
              <p className="mt-1 text-base text-aw-gold">{instructor.title}</p>
              <p className="mt-5 text-lg leading-[1.75] text-aw-cream/85">
                Ralf Hermanski bringt jahrzehntelange Praxis aus dem
                Fleischerhandwerk in jeden Kurs ein — verständlich erklärt und
                direkt umsetzbar.
              </p>
            </section>
          </div>

          {/* Sticky Kaufbox — nur Desktop */}
          <div className="hidden lg:block">{purchaseBox}</div>
        </div>
      </div>

      {/* 9. Abschluss-CTA */}
      <section className="border-t border-aw-border bg-aw-surface/40">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <h2 className="font-display text-3xl font-bold text-aw-cream">
            Bereit für dein nächstes Handwerksprojekt?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-lg leading-relaxed text-aw-muted">
            Starte jetzt mit strukturiertem Lernen — Schritt für Schritt zum
            besseren Metzger.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {hasAccess ? (
              <Link
                href={`/mein-bereich/kurse/${course.slug}`}
                className="inline-flex items-center justify-center rounded-lg bg-aw-gold px-8 py-3.5 text-sm font-semibold text-aw-bg hover:bg-aw-gold-dark"
              >
                Kurs starten
              </Link>
            ) : checkoutTarget && course.priceCents !== null && course.priceCents > 0 ? (
              <Link
                href={
                  isLoggedIn
                    ? `/kaufen/${checkoutTarget.productSlug}`
                    : `/anmelden?next=${encodeURIComponent(`/kaufen/${checkoutTarget.productSlug}`)}`
                }
                className="inline-flex items-center justify-center rounded-lg bg-aw-gold px-8 py-3.5 text-sm font-semibold text-aw-bg hover:bg-aw-gold-dark"
              >
                Jetzt kaufen
              </Link>
            ) : course.priceCents === 0 ? (
              <Link
                href={
                  isLoggedIn
                    ? `/mein-bereich/kurse/${course.slug}`
                    : `/anmelden?next=${encodeURIComponent(`/mein-bereich/kurse/${course.slug}`)}`
                }
                className="inline-flex items-center justify-center rounded-lg bg-aw-gold px-8 py-3.5 text-sm font-semibold text-aw-bg hover:bg-aw-gold-dark"
              >
                Kostenlos starten
              </Link>
            ) : (
              <Link
                href="/kontakt"
                className="inline-flex items-center justify-center rounded-lg bg-aw-gold px-8 py-3.5 text-sm font-semibold text-aw-bg hover:bg-aw-gold-dark"
              >
                Kauf anfragen
              </Link>
            )}
            <Link
              href="/akademie/kurse"
              className="inline-flex items-center justify-center rounded-lg border border-aw-border px-8 py-3.5 text-sm font-semibold text-aw-cream hover:border-aw-gold/50"
            >
              Weitere Kurse
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
