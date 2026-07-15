import type { Metadata } from "next";
import Link from "next/link";

import EditablePageHeader from "@/components/marketing/EditablePageHeader";
import CourseCatalogCard from "@/components/courses/CourseCatalogCard";
import LearningPathCard from "@/components/courses/LearningPathCard";
import {
  listFeaturedHomepageCourses,
  listPublishedCourses,
} from "@/lib/courses/course-catalog-service";
import { listPublicCourseGroups } from "@/lib/course-groups/course-group-service";
import { buildStaticPageMetadata } from "@/lib/page-seo/page-seo-static-metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return buildStaticPageMetadata("/akademie", {
    title: "Akademie",
    description:
      "Strukturierte Lernpfade und Kurse für Wurstherstellung, Räuchern und Fleischverarbeitung.",
  });
}

export default async function AkademiePage() {
  const [learningPaths, publishedCourses, featuredCourses] = await Promise.all([
    listPublicCourseGroups(),
    listPublishedCourses(),
    listFeaturedHomepageCourses(),
  ]);

  const highlightCourses =
    featuredCourses.length > 0
      ? featuredCourses.slice(0, 3)
      : publishedCourses.slice(0, 3);

  return (
    <>
      <EditablePageHeader
        eyebrowKey="akademie.header.eyebrow"
        titleKey="akademie.header.title"
        descriptionKey="akademie.header.description"
        imageKey="akademie.header.image"
        imageAltKey="akademie.header.image_alt"
        fallbacks={{
          eyebrow: "Akademie",
          title: "Lernen mit System – von den Grundlagen bis zur Meisterschaft",
          description:
            "Unsere Lernpfade führen dich progressiv durch das Handwerk. Jeder Kurs ist in Module und Lektionen gegliedert und schließt mit einem Zertifikat ab.",
          image: "/akademie-header.png",
          imageAlt: "Wurstwaren auf einem Holzbrett",
        }}
      />

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-aw-cream">
              Lernpfade
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-aw-muted">
              Thematisch sortierte Pfade mit optionalen Modulen und zugeordneten
              Kursen.
            </p>
          </div>
          <Link
            href="/akademie/kurse"
            className="text-sm font-semibold text-aw-gold hover:text-aw-cream"
          >
            Zum Kurskatalog →
          </Link>
        </div>

        {learningPaths.length === 0 ? (
          <p className="mt-8 rounded-xl border border-aw-border bg-aw-surface/40 p-6 text-sm text-aw-muted">
            Noch keine Lernpfade veröffentlicht. Sobald Pfade angelegt sind,
            erscheinen sie hier mit Beschreibung, Level und Kursanzahl.
          </p>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {learningPaths.map((path) => (
              <LearningPathCard key={path.id} path={path} />
            ))}
          </div>
        )}
      </section>

      <section className="border-t border-aw-border bg-aw-surface/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-2xl font-bold text-aw-cream">
              Kurs-Highlights
            </h2>
            <Link
              href="/akademie/kurse"
              className="text-sm font-semibold text-aw-gold hover:text-aw-cream"
            >
              Alle Kurse →
            </Link>
          </div>
          {highlightCourses.length === 0 ? (
            <p className="mt-8 text-sm text-aw-muted">
              Aktuell sind keine Kurse veröffentlicht.
            </p>
          ) : (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {highlightCourses.map((course) => (
                <CourseCatalogCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
