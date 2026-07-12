import type { Metadata } from "next";
import Link from "next/link";

import EditablePageHeader from "@/components/marketing/EditablePageHeader";
import CourseCatalogCard from "@/components/courses/CourseCatalogCard";
import {
  listFeaturedHomepageCourses,
  listPublishedCourses,
} from "@/lib/courses/course-catalog-service";
import { buildStaticPageMetadata } from "@/lib/page-seo/page-seo-static-metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return buildStaticPageMetadata("/akademie", {
    title: "Akademie",
    description:
      "Strukturierte Lernpfade und Kurse für Wurstherstellung, Räuchern und Fleischverarbeitung.",
  });
}

const paths = [
  {
    title: "Wurst-Einsteiger",
    level: "Einsteiger",
    courses: 3,
    description: "Grundlagen, erste Wurst und Gewürzkunde für den sicheren Start.",
  },
  {
    title: "Räucher-Profi",
    level: "Fortgeschritten",
    courses: 4,
    description: "Kalt- und Heißräuchern, Rauchführung und Räucherprogramme.",
  },
  {
    title: "Meister-Programm",
    level: "Meister",
    courses: 6,
    description: "Alle Aufbaukurse plus Mentoring – der Weg zum Meisterniveau.",
  },
];

export default async function AkademiePage() {
  const publishedCourses = await listPublishedCourses();
  const featuredCourses = await listFeaturedHomepageCourses();
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
        <h2 className="font-display text-2xl font-bold text-aw-cream">Lernpfade</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {paths.map((p) => (
            <article
              key={p.title}
              className="flex flex-col rounded-xl border border-aw-border bg-aw-surface p-6"
            >
              <span className="text-xs font-medium uppercase tracking-wider text-aw-gold">
                {p.level}
              </span>
              <h3 className="mt-2 font-display text-xl font-bold text-aw-cream">
                {p.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-aw-muted">
                {p.description}
              </p>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-aw-muted">{p.courses} Kurse</span>
                <Link
                  href="/akademie/kurse"
                  className="font-semibold text-aw-gold hover:text-aw-cream"
                >
                  Pfad ansehen →
                </Link>
              </div>
            </article>
          ))}
        </div>
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
