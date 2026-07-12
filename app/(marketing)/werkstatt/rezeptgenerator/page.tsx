/**
 * @file page.tsx
 * @purpose Rezeptübersicht unter `/werkstatt/rezeptgenerator`.
 */

import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/marketing/PageHeader";
import MembershipRolePrototype from "@/components/membership/MembershipRolePrototype";
import RecipeGeneratorList from "@/components/tools/recipe-generator/RecipeGeneratorList";
import { buildStaticPageMetadata } from "@/lib/page-seo/page-seo-static-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildStaticPageMetadata("/werkstatt/rezeptgenerator", {
    title: "Rezeptgenerator",
    description:
      "Wurstrezepturen erstellen, berechnen und speichern – mit Fleisch-, Schüttungs- und Gewürzlogik.",
  });
}

export default function RezeptgeneratorPage() {
  return (
    <>
      <PageHeader
        eyebrow="Werkstatt / Rezeptgenerator"
        title="Rezeptgenerator"
        description="Erstelle und verwalte deine Wurstrezepturen – mit Live-Berechnung von Anteilen, Gewichten und Zutatenmengen."
      />

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-8">
          <MembershipRolePrototype />
        </div>

        <RecipeGeneratorList />

        <p className="mt-8 text-center">
          <Link
            href="/werkstatt"
            className="text-sm font-semibold text-aw-gold transition-colors hover:text-aw-cream"
          >
            ← Zurück zur Werkstatt
          </Link>
        </p>
      </section>
    </>
  );
}
