import type { Metadata } from "next";

import PageHeader from "@/components/marketing/PageHeader";
import WorkshopProductRecommendationsClient from "@/components/werkstatt/WorkshopProductRecommendationsClient";
import { buildStaticPageMetadata } from "@/lib/page-seo/page-seo-static-metadata";
import {
  getAffiliateDisclosureText,
  listProductRecommendationCategories,
  listPublishedProductRecommendations,
} from "@/lib/product-recommendations/product-recommendation-service";

export async function generateMetadata(): Promise<Metadata> {
  return buildStaticPageMetadata("/werkstatt/empfehlungen", {
    title: "Empfehlungen & Ausrüstung",
    description:
      "Kuratierte Produktempfehlungen für Wurstherstellung: Werkzeuge, Maschinen, Gewürze, Därme und Zubehör.",
  });
}

export default async function EmpfehlungenPage() {
  const [products, categories, disclosure] = await Promise.all([
    listPublishedProductRecommendations(),
    listProductRecommendationCategories(),
    getAffiliateDisclosureText(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Werkstatt / Empfehlungen"
        title="Empfehlungen & Ausrüstung"
        description="Kuratierte Werkzeuge, Maschinen, Gewürze und Zubehör — ausgewählt für ambitionierte Hobbywurster und Profis."
      />

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <WorkshopProductRecommendationsClient
          products={products}
          categories={categories}
          disclosure={disclosure}
        />
      </section>
    </>
  );
}
