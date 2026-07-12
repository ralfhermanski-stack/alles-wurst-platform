import type { Metadata } from "next";

import RecipePdfExportView from "@/components/tools/recipe-generator/RecipePdfExportView";

export const metadata: Metadata = {
  title: "Rezept PDF",
  robots: { index: false, follow: false },
};

type RecipeExportPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ auto?: string }>;
};

/**
 * Druckoptimierte Exportseite für gespeicherte Rezepte.
 */
export default async function RecipeExportPage({
  params,
  searchParams,
}: RecipeExportPageProps) {
  const { id } = await params;
  const { auto } = await searchParams;

  return <RecipePdfExportView recipeId={id} autoPrint={auto === "1"} />;
}
