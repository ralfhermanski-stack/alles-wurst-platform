/**
 * @file page.tsx
 * @purpose Bestehendes Rezept bearbeiten — `/werkstatt/rezeptgenerator/[id]`.
 */

import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/marketing/PageHeader";
import RecipeGeneratorWizard from "@/components/tools/recipe-generator/RecipeGeneratorWizard";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "Rezept bearbeiten",
  description: "Wurstrezeptur im Rezeptgenerator bearbeiten.",
};

export default async function RezeptBearbeitenPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <>
      <PageHeader
        eyebrow="Werkstatt / Rezeptgenerator"
        title="Rezept bearbeiten"
        description="Änderungen werden live berechnet und können als Entwurf oder gespeichertes Rezept abgelegt werden."
      />

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <RecipeGeneratorWizard recipeId={id} />

        <p className="mt-8 text-center">
          <Link
            href="/werkstatt/rezeptgenerator"
            className="text-sm font-semibold text-aw-gold transition-colors hover:text-aw-cream"
          >
            ← Zur Rezeptübersicht
          </Link>
        </p>
      </section>
    </>
  );
}
