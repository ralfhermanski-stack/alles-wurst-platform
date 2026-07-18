import type { Metadata } from "next";
import Link from "next/link";

import PageHeader from "@/components/marketing/PageHeader";
import CourseCatalogCard from "@/components/courses/CourseCatalogCard";
import { listPublishedCourses } from "@/lib/courses/course-catalog-service";
import { buildStaticPageMetadata } from "@/lib/page-seo/page-seo-static-metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return buildStaticPageMetadata("/akademie/kurse", {
    title: "Kurse",
    description: "Der vollständige Kurskatalog der Alles-Wurst Akademie.",
  });
}

export default async function KursePage() {
  const courses = await listPublishedCourses();

  return (
    <>
      <PageHeader
        eyebrow="Akademie / Kurse"
        title="Kurskatalog"
        description="Alle kostenpflichtigen Kurse — Minikurse und Zertifikatskurse."
      />

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="font-display text-2xl font-bold text-aw-cream">
          Alle Kurse
        </h2>
        <p className="mt-2 text-sm text-aw-muted">
          {courses.length} Kurs{courses.length === 1 ? "" : "e"} verfügbar
        </p>

        {courses.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-aw-border bg-aw-surface/40 p-6 text-center">
            <p className="text-sm text-aw-muted">
              Aktuell sind keine Kurse veröffentlicht.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-4">
              <Link
                href="/werkstatt"
                className="text-sm font-semibold text-aw-gold hover:text-aw-cream"
              >
                Zur Werkstatt →
              </Link>
              <Link
                href="/mein-bereich"
                className="text-sm font-semibold text-aw-gold hover:text-aw-cream"
              >
                Zum Mein-Bereich →
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCatalogCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
