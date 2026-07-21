import type { Metadata } from "next";

import RecipePdfExportView from "@/components/tools/recipe-generator/RecipePdfExportView";
import { parseRecipePdfAuthorDisplay } from "@/lib/tools/recipe-pdf-author";

export const metadata: Metadata = {
  title: "Rezept PDF",
  robots: { index: false, follow: false },
};

type RecipeExportPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ auto?: string; author?: string }>;
};

/**
 * Druckoptimierte Exportseite für gespeicherte Rezepte.
 */
export default async function RecipeExportPage({
  params,
  searchParams,
}: RecipeExportPageProps) {
  const { id } = await params;
  const { auto, author } = await searchParams;

  return (
    <RecipePdfExportView
      recipeId={id}
      autoPrint={auto === "1"}
      authorDisplay={parseRecipePdfAuthorDisplay(author)}
    />
  );
}
