/**
 * @file page.tsx
 * @purpose Route für den Salzrechner unter `/werkstatt/salzrechner`.
 * @responsibility Seitenlayout, Metadaten und Einbindung der Rechner-Komponente.
 * @usage Erreichbar über die Werkstatt und direkte URL – erste produktive Tool-Seite.
 */

import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/marketing/PageHeader";
import SaltCalculator from "@/components/tools/SaltCalculator";
import { buildStaticPageMetadata } from "@/lib/page-seo/page-seo-static-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildStaticPageMetadata("/werkstatt/salzrechner", {
    title: "Salzrechner",
    description:
      "Berechne die benötigte Salzmenge für Fleisch und Wurst – Salzgabe in g/kg mit Bewertung mild, normal oder stark.",
  });
}

export default function SalzrechnerPage() {
  return (
    <>
      <PageHeader
        eyebrow="Werkstatt / Salzrechner"
        title="Salzrechner"
        description="Wie viel Salz brauchst du? Gib die Fleischmenge ein, wähle die Salzgabe in g/kg – der Rechner liefert die Menge in Gramm und bewertet die Würzung."
      />

      <section className="mx-auto max-w-xl px-4 py-12 sm:px-6 sm:py-16">
        <SaltCalculator />

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
