import type { Metadata } from "next";

import WithdrawalFormPanel from "@/components/legal/WithdrawalFormPanel";
import PageHeader from "@/components/marketing/PageHeader";
import { buildStaticPageMetadata } from "@/lib/page-seo/page-seo-static-metadata";

type PageProps = {
  searchParams: Promise<{ order?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return buildStaticPageMetadata("/widerrufsformular", {
    title: "Widerrufsformular",
    description: "Digitales Widerrufsformular der Alles-Wurst Plattform.",
  });
}

export default async function WiderrufsformularPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const orderToken = params.order ?? null;

  return (
    <>
      <PageHeader
        eyebrow="Rechtliches"
        title="Widerrufsformular"
        description="Erkläre deinen Widerruf digital. Eine Eingangsbestätigung folgt nach Prüfung."
      />

      <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <WithdrawalFormPanel orderToken={orderToken} />
      </section>
    </>
  );
}
