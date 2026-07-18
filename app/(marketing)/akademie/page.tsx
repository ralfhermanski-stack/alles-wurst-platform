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
      "Kurse für Wurstherstellung, Räuchern und Fleischverarbeitung — von den Grundlagen bis zur Meisterschaft.",
  });
}

export default async function AkademiePage() {
  const [publishedCourses, featuredCourses] = await Promise.all([
    listPublishedCourses(),
    listFeaturedHomepageCourses(),
  ]);

  const highlightCourses =
    featuredCourses.length > 0
      ? featuredCourses.slice(0, 6)
      : publishedCourses.slice(0, 6);

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
            "Jeder Kurs ist in Module und Lektionen gegliedert und schließt mit einem Zertifikat ab. Starte im Katalog und lerne in deinem Tempo.",
          image: "/akademie-header.png",
          imageAlt: "Wurstwaren auf einem Holzbrett",
        }}
      />

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-aw-cream">
              Kurse
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-aw-muted">
              Minikurse und Zertifikatskurse — praxisnah und Schritt für Schritt.
            </p>
          </div>
          <Link
            href="/akademie/kurse"
            className="text-sm font-semibold text-aw-gold hover:text-aw-cream"
          >
            Zum Kurskatalog →
          </Link>
        </div>

        {highlightCourses.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-aw-border bg-aw-surface/40 p-6 text-center">
            <p className="text-sm text-aw-muted">
              Aktuell sind noch keine Kurse veröffentlicht.
            </p>
            <Link
              href="/werkstatt"
              className="mt-3 inline-flex text-sm font-semibold text-aw-gold hover:text-aw-cream"
            >
              Zur Werkstatt →
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {highlightCourses.map((course) => (
              <CourseCatalogCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
