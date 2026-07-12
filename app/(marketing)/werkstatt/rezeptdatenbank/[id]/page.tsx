import type { Metadata } from "next";

import RecipeDatabaseDetail from "@/components/tools/recipe-database/RecipeDatabaseDetail";
import RecommendedProductsSection from "@/components/werkstatt/RecommendedProductsSection";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;

  return {
    title: "Rezept",
    description: `Offizielles Rezept ${id} in der Alles-Wurst Rezeptdatenbank.`,
  };
}

export default async function RezeptdatenbankDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <RecipeDatabaseDetail recipeId={id} />
      <RecommendedProductsSection recipeId={id} />
    </section>
  );
}
