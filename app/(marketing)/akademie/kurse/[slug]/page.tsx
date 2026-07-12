import type { Metadata } from "next";
import { notFound } from "next/navigation";

import CourseSalesPageContent from "@/components/courses/CourseSalesPageContent";
import RecommendedProductsSection from "@/components/werkstatt/RecommendedProductsSection";
import PageSeoJsonLd from "@/components/seo/PageSeoJsonLd";
import { resolveCourseSalesContext } from "@/lib/courses/course-sales-context";
import { getCourseForSales } from "@/lib/courses/course-catalog-service";
import { buildRouteKey } from "@/lib/page-seo/page-seo-site";
import { resolvePageMetadata } from "@/lib/page-seo/page-seo-metadata";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseForSales(slug);

  if (!course) {
    return {
      title: "Kurs nicht gefunden",
    };
  }

  const description =
    course.shortDescription?.trim() ||
    course.description?.slice(0, 160).replace(/\s+/g, " ").trim() ||
    `${course.title} — Kurs in der Alles-Wurst Akademie`;

  return resolvePageMetadata(buildRouteKey("course", slug), {
    title: course.title,
    description,
    openGraph: {
      title: course.title,
      description,
      type: "website",
    },
  });
}

export default async function AkademieCourseDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const context = await resolveCourseSalesContext(slug);

  if (!context) {
    notFound();
  }

  return (
    <>
      <PageSeoJsonLd routeKey={buildRouteKey("course", slug)} />
      <CourseSalesPageContent context={context} />
      <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <RecommendedProductsSection courseId={context.course.id} />
      </div>
    </>
  );
}
