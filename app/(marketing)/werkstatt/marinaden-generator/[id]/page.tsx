/**
 * @file page.tsx — Marinade bearbeiten
 */

import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/marketing/PageHeader";
import MembershipRolePrototype from "@/components/membership/MembershipRolePrototype";
import MarinadeGeneratorEditContent from "@/components/tools/marinade-generator/MarinadeGeneratorEditContent";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "Marinade bearbeiten",
};

export default async function MarinadeBearbeitenPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <>
      <PageHeader
        eyebrow="Werkstatt / Marinaden-Generator"
        title="Marinade bearbeiten"
        description="Werte anpassen, neu skalieren und als neue Version speichern."
      />

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-8">
          <MembershipRolePrototype />
        </div>

        <MarinadeGeneratorEditContent recipeId={id} />

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
