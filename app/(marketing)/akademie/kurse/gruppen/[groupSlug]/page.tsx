import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import PageHeader from "@/components/marketing/PageHeader";
import CourseCatalogCard from "@/components/courses/CourseCatalogCard";
import { getCourseGroupBySlug } from "@/lib/course-groups/course-group-service";
import { listPublishedCourses } from "@/lib/courses/course-catalog-service";
import { buildRouteKey } from "@/lib/page-seo/page-seo-site";
import { resolvePageMetadata } from "@/lib/page-seo/page-seo-metadata";

export const dynamic = "force-dynamic";

type GroupPageProps = {
  params: Promise<{ groupSlug: string }>;
};

export async function generateMetadata({
  params,
}: GroupPageProps): Promise<Metadata> {
  const { groupSlug } = await params;
  const group = await getCourseGroupBySlug(groupSlug, { activeOnly: true });

  if (!group) {
    return { title: "Kursgruppe nicht gefunden" };
  }

  return resolvePageMetadata(buildRouteKey("course_group", groupSlug), {
    title: group.name,
    description:
      group.shortDescription ??
      `Kurse in der Kategorie ${group.name} — Alles-Wurst Akademie.`,
  });
}

export default async function CourseGroupPage({ params }: GroupPageProps) {
  const { groupSlug } = await params;
  const group = await getCourseGroupBySlug(groupSlug, { activeOnly: true });

  if (!group) {
    notFound();
  }

  const courses = await listPublishedCourses({ groupSlug: group.slug });

  return (
    <>
      <PageHeader
        eyebrow="Akademie / Lernpfad"
        title={group.name}
        description={
          group.shortDescription ??
          `Alle veröffentlichten Kurse in „${group.name}".`
        }
      />

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <nav className="text-sm text-aw-muted">
          <Link href="/akademie/kurse" className="hover:text-aw-gold">
            Kurskatalog
          </Link>
          <span className="mx-2">/</span>
          <span className="text-aw-cream">{group.name}</span>
        </nav>

        {group.subgroups.length > 0 && (
          <div className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-aw-gold">
              Module
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {group.subgroups.map((subgroup) => (
                <Link
                  key={subgroup.id}
                  href={`/akademie/kurse/gruppen/${group.slug}/${subgroup.slug}`}
                  className="rounded-full border border-aw-border bg-aw-surface px-4 py-2 text-sm text-aw-cream transition-colors hover:border-aw-gold/50 hover:text-aw-gold"
                >
                  {subgroup.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        <p className="mt-8 text-sm text-aw-muted">
          {courses.length} Kurs{courses.length === 1 ? "" : "e"} in dieser Gruppe
        </p>

        {courses.length === 0 ? (
          <p className="mt-6 text-sm text-aw-muted">
            In dieser Gruppe sind aktuell keine Kurse veröffentlicht.
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
