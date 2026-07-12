/**
 * @file page.tsx — Neue Marinade
 */

import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/marketing/PageHeader";
import MembershipRolePrototype from "@/components/membership/MembershipRolePrototype";
import MarinadeGeneratorNewContent from "@/components/tools/marinade-generator/MarinadeGeneratorNewContent";

export const metadata: Metadata = {
  title: "Neue Marinade",
  description: "Neues Marinaden-Rezept im Assistenten anlegen.",
};

export default function NeueMarinadePage() {
  return (
    <>
      <PageHeader
        eyebrow="Werkstatt / Marinaden-Generator"
        title="Neue Marinade"
        description="Schritt für Schritt zur perfekten Marinade — Zutaten werden automatisch berechnet und skaliert."
      />

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-8">
          <MembershipRolePrototype />
        </div>

        <MarinadeGeneratorNewContent />

        <p className="mt-8 text-center">
          <Link
            href="/werkstatt/marinaden-generator"
            className="text-sm font-semibold text-aw-gold transition-colors hover:text-aw-cream"
          >
            ← Zur Marinaden-Übersicht
          </Link>
        </p>
      </section>
    </>
  );
}
