import Link from "next/link";

import RecipeGeneratorWizard from "@/components/tools/recipe-generator/RecipeGeneratorWizard";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminRecipeEditPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="p-6 sm:p-8">
      <Link
        href={`/admin/werkstatt/rezeptgenerator/${id}`}
        className="text-sm text-aw-muted hover:text-aw-gold"
      >
        ← Zurück zur Admin-Übersicht
      </Link>
      <div className="mt-4">
        <RecipeGeneratorWizard recipeId={id} adminMode />
      </div>
    </div>
  );
}
