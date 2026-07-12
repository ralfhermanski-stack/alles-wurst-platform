import type { Metadata } from "next";

import PhilosophyPageContent from "@/components/marketing/PhilosophyPageContent";
import PageSeoJsonLd from "@/components/seo/PageSeoJsonLd";
import { buildStaticPageMetadata } from "@/lib/page-seo/page-seo-static-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildStaticPageMetadata("/philosophie", {
    title: "Meine Philosophie",
    description:
      "Sechs Grundsätze unseres Handwerks: Geduld, Respekt, gute Zutaten, wenig Zusatzstoffe, eigener Geschmack und Meisterleidenschaft.",
  });
}

export default function PhilosophiePage() {
  return (
    <>
      <PageSeoJsonLd routeKey="static:/philosophie" />
      <PhilosophyPageContent />
    </>
  );
}
