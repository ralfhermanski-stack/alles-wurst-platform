/**
 * @file page.tsx
 * @purpose Neues Rezept anlegen — Wizard unter `/werkstatt/rezeptgenerator/neu`.
 */

import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/marketing/PageHeader";
import MembershipRolePrototype from "@/components/membership/MembershipRolePrototype";
import RecipeGeneratorNewContent from "@/components/tools/recipe-generator/RecipeGeneratorNewContent";

export const metadata: Metadata = {
  title: "Neues Rezept",
  description: "Neue Wurstrezeptur im Rezeptgenerator anlegen.",
};

export default function NeuesRezeptPage() {
  return (
    <>
      <PageHeader
        eyebrow="Werkstatt / Rezeptgenerator"
        title="Neues Rezept"
        description="Der Assistent führt dich Schritt für Schritt durch Grunddaten, Fleisch, Schüttung, Gewürze und mehr."
      />

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-8">
          <MembershipRolePrototype />
        </div>

        <RecipeGeneratorNewContent />

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
