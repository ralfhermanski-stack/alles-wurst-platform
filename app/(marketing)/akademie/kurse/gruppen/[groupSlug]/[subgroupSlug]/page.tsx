import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import PageHeader from "@/components/marketing/PageHeader";
import CourseCatalogCard from "@/components/courses/CourseCatalogCard";
import { getCourseSubgroupBySlugs } from "@/lib/course-groups/course-group-service";
import { listPublishedCourses } from "@/lib/courses/course-catalog-service";
import { buildRouteKey } from "@/lib/page-seo/page-seo-site";
import { resolvePageMetadata } from "@/lib/page-seo/page-seo-metadata";

export const dynamic = "force-dynamic";

type SubgroupPageProps = {
  params: Promise<{ groupSlug: string; subgroupSlug: string }>;
};

export async function generateMetadata({
  params,
}: SubgroupPageProps): Promise<Metadata> {
  const { groupSlug, subgroupSlug } = await params;
  const subgroup = await getCourseSubgroupBySlugs(groupSlug, subgroupSlug, {
    activeOnly: true,
  });

  if (!subgroup) {
    return { title: "Untergruppe nicht gefunden" };
  }

  return resolvePageMetadata(
    buildRouteKey("course_subgroup", `${groupSlug}/${subgroupSlug}`),
    {
      title: `${subgroup.name} — ${subgroup.group.name}`,
      description:
        subgroup.shortDescription ??
        `Kurse in ${subgroup.name} (${subgroup.group.name}).`,
    },
  );
}

export default async function CourseSubgroupPage({ params }: SubgroupPageProps) {
  const { groupSlug, subgroupSlug } = await params;
  const subgroup = await getCourseSubgroupBySlugs(groupSlug, subgroupSlug, {
    activeOnly: true,
  });

  if (!subgroup) {
    notFound();
  }

  const courses = await listPublishedCourses({
    groupSlug: subgroup.group.slug,
    subgroupSlug: subgroup.slug,
  });

  return (
    <>
      <PageHeader
        eyebrow={`Akademie / ${subgroup.group.name}`}
        title={subgroup.name}
        description={
          subgroup.shortDescription ??
          `Alle veröffentlichten Kurse in „${subgroup.name}".`
        }
      />

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <nav className="text-sm text-aw-muted">
          <Link href="/akademie/kurse" className="hover:text-aw-gold">
            Kurskatalog
          </Link>
          <span className="mx-2">/</span>
          <Link
            href={`/akademie/kurse/gruppen/${subgroup.group.slug}`}
            className="hover:text-aw-gold"
          >
            {subgroup.group.name}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-aw-cream">{subgroup.name}</span>
        </nav>

        <p className="mt-8 text-sm text-aw-muted">
          {courses.length} Kurs{courses.length === 1 ? "" : "e"} in dieser
          Untergruppe
        </p>

        {courses.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-aw-border bg-aw-surface/40 p-6">
            <p className="text-sm text-aw-muted">
              In dieser Untergruppe sind aktuell keine Kurse veröffentlicht.
            </p>
            <Link
              href={`/akademie/kurse/gruppen/${subgroup.group.slug}`}
              className="mt-3 inline-flex text-sm font-semibold text-aw-gold hover:text-aw-cream"
            >
              Zur Gruppe →
            </Link>
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
