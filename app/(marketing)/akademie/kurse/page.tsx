import type { Metadata } from "next";

import PageHeader from "@/components/marketing/PageHeader";
import CourseCatalogCard from "@/components/courses/CourseCatalogCard";
import CourseGroupCard from "@/components/courses/CourseGroupCard";
import { listPublicCourseGroups } from "@/lib/course-groups/course-group-service";
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
  const [groups, courses] = await Promise.all([
    listPublicCourseGroups(),
    listPublishedCourses(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Akademie / Kurse"
        title="Kurskatalog"
        description="Alle kostenpflichtigen Kurse — Minikurse und Zertifikatskurse."
      />

      {groups.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-12 sm:px-6">
          <h2 className="font-display text-2xl font-bold text-aw-cream">
            Lernpfade
          </h2>
          <p className="mt-2 text-sm text-aw-muted">
            Nach Themen filtern — wähle einen Lernpfad oder ein Modul.
          </p>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <CourseGroupCard key={group.id} group={group} />
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="font-display text-2xl font-bold text-aw-cream">
          Alle Kurse
        </h2>
        <p className="mt-2 text-sm text-aw-muted">
          {courses.length} Kurs{courses.length === 1 ? "" : "e"} verfügbar
        </p>

        {courses.length === 0 ? (
          <p className="mt-6 text-sm text-aw-muted">
            Aktuell sind keine Kurse veröffentlicht.
          </p>
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
