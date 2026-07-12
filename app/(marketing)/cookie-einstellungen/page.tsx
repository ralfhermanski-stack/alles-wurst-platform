import type { Metadata } from "next";

import CookieSettingsPanel from "@/components/legal/CookieSettingsPanel";
import LegalDocumentPageView from "@/components/legal/LegalDocumentPageView";
import PageHeader from "@/components/marketing/PageHeader";
import {
  ensureDefaultLegalDocuments,
  getPublishedLegalDocumentBySlug,
} from "@/lib/legal/legal-document-service";
import { buildStaticPageMetadata } from "@/lib/page-seo/page-seo-static-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildStaticPageMetadata("/cookie-einstellungen", {
    title: "Cookie-Einstellungen",
    description: "Verwalte deine Cookie-Einwilligungen auf der Alles-Wurst Plattform.",
  });
}

export default async function CookieEinstellungenPage() {
  await ensureDefaultLegalDocuments();
  const policy = await getPublishedLegalDocumentBySlug("cookie-einstellungen");

  return (
    <>
      <PageHeader
        eyebrow="Rechtliches"
        title="Cookie-Einstellungen"
        description="Verwalte deine Einwilligungen jederzeit."
      />

      <section className="mx-auto max-w-3xl space-y-10 px-4 py-14 sm:px-6">
        <CookieSettingsPanel />

        {policy && (
          <div>
            <h2 className="font-display text-xl font-bold text-aw-cream">
              Cookie-Richtlinie
            </h2>
            <div className="mt-6">
              <LegalDocumentPageView document={policy} showPrint={false} />
            </div>
          </div>
        )}
      </section>
    </>
  );
}
