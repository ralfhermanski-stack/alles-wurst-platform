import type { Metadata } from "next";
import { notFound } from "next/navigation";

import WorkshopProductDetailClient from "@/components/werkstatt/WorkshopProductDetailClient";
import {
  getAffiliateDisclosureText,
  getPublishedProductRecommendationBySlug,
} from "@/lib/product-recommendations/product-recommendation-service";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublishedProductRecommendationBySlug(slug, {
    recordView: false,
  });

  if (!product) {
    return { title: "Produkt nicht gefunden" };
  }

  return {
    title: product.seoTitle ?? `${product.title} | Alles-Wurst Werkstatt`,
    description: product.seoDescription ?? product.shortDescription,
    openGraph: {
      title: product.ogTitle ?? product.title,
      description: product.ogDescription ?? product.shortDescription,
      images: product.imageUrl ? [{ url: product.imageUrl }] : undefined,
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const [product, disclosure] = await Promise.all([
    getPublishedProductRecommendationBySlug(slug),
    getAffiliateDisclosureText(),
  ]);

  if (!product) {
    notFound();
  }

  return <WorkshopProductDetailClient product={product} disclosure={disclosure} />;
}
