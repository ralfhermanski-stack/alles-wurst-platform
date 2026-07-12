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
        eyebrow="Werkstatt · Club"
        title="Offizielle Rezeptdatenbank"
        description="Freigegebene Meisterrezepte der Alles-Wurst Community — durchsuchbar, filterbar und direkt in deinen Rezeptgenerator kopierbar."
      />

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-8">
          <MembershipRolePrototype />
        </div>

        <RecipeDatabaseList />
      </section>
    </>
  );
}
