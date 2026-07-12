/**
 * @file page.tsx
 * @purpose Route für den Lakerechner unter `/werkstatt/lakerechner`.
 * @responsibility Seitenlayout, Metadaten und Einbindung der Rechner-Komponente.
 * @usage Erreichbar über die Werkstatt und direkte URL.
 */

import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/marketing/PageHeader";
import BrineCalculator from "@/components/tools/BrineCalculator";
import { buildStaticPageMetadata } from "@/lib/page-seo/page-seo-static-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildStaticPageMetadata("/werkstatt/lakerechner", {
    title: "Lakerechner",
    description:
      "Lake neutral berechnen – Liter, Konzentration und Zutaten. Ohne Produktauswahl, als übersichtliches Lake-Rezept.",
  });
}

export default function LakerechnerPage() {
  return (
    <>
      <PageHeader
        eyebrow="Werkstatt / Lakerechner"
        title="Lakerechner"
        description="Lake ist Lake: Wähle Lakeart, Liter und Konzentration – der Rechner liefert ein neutrales Lake-Rezept mit den benötigten Zutaten."
      />

      <section className="mx-auto max-w-xl px-4 py-12 sm:px-6 sm:py-16">
        <BrineCalculator />

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
