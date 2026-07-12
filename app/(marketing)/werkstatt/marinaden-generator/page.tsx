/**
 * @file page.tsx — Marinaden-Generator Übersicht
 */

import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/marketing/PageHeader";
import MembershipRolePrototype from "@/components/membership/MembershipRolePrototype";
import MarinadeGeneratorList from "@/components/tools/marinade-generator/MarinadeGeneratorList";
import { buildStaticPageMetadata } from "@/lib/page-seo/page-seo-static-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildStaticPageMetadata("/werkstatt/marinaden-generator", {
    title: "Marinaden-Generator",
    description:
      "Marinaden-Rezepte erstellen, berechnen, speichern und als PDF exportieren.",
  });
}

export default function MarinadenGeneratorPage() {
  return (
    <>
      <PageHeader
        eyebrow="Werkstatt / Marinaden-Generator"
        title="Marinaden-Generator"
        description="Der Assistent führt dich durch Produktwahl, Marinadenart, Gewicht, Zutaten und Anleitung — mit automatischer Skalierung und PDF-Export."
      />

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-8">
          <MembershipRolePrototype />
        </div>

        <MarinadeGeneratorList />

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
