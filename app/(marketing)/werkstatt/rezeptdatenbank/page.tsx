import type { Metadata } from "next";

import PageHeader from "@/components/marketing/PageHeader";
import MembershipRolePrototype from "@/components/membership/MembershipRolePrototype";
import RecipeDatabaseList from "@/components/tools/recipe-database/RecipeDatabaseList";
import { buildStaticPageMetadata } from "@/lib/page-seo/page-seo-static-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildStaticPageMetadata("/werkstatt/rezeptdatenbank", {
    title: "Rezeptdatenbank",
    description:
      "Offizielle Alles-Wurst Rezepte durchsuchen, filtern und in den eigenen Rezeptgenerator kopieren.",
  });
}

export default function RezeptdatenbankPage() {
  return (
    <>
      <PageHeader
        eyebrow="Werkstatt"
        title="Rezeptdatenbank"
        description="Alle freigegebenen Rezepte als Vorschau — vollständig öffenbar je nach Mitgliedschaft und gebuchten Kursen. Freigegebene Rezepte kannst du in deinen Rezeptgenerator kopieren."
      />

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 space-y-8">
        <MembershipRolePrototype />
        <RecipeDatabaseList />
      </section>
    </>
  );
}
