import type { Metadata } from "next";
import Link from "next/link";

import PageHeader from "@/components/marketing/PageHeader";
import { listLegalOverviewDocuments } from "@/lib/legal/legal-document-service";
import { buildStaticPageMetadata } from "@/lib/page-seo/page-seo-static-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildStaticPageMetadata("/rechtliches", {
    title: "Rechtliches",
    description: "Übersicht aller rechtlichen Dokumente der Alles-Wurst Plattform.",
  });
}

export default async function RechtlichesPage() {
  const documents = await listLegalOverviewDocuments();

  return (
    <>
      <PageHeader
        eyebrow="Information"
        title="Rechtliches"
        description="Alle rechtlichen Dokumente und Verbraucherinformationen auf einen Blick."
      />

      <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <ul className="space-y-4">
          {documents.map((document) => (
            <li
              key={document.slug}
              className="flex items-center justify-between rounded-xl border border-aw-border bg-aw-surface px-5 py-4"
            >
              <div>
                <Link
                  href={`/${document.slug}`}
                  className="font-semibold text-aw-cream hover:text-aw-gold"
                >
                  {document.title}
                </Link>
                {!document.published && (
                  <p className="mt-1 text-xs text-amber-400">
                    Noch nicht veröffentlicht — neutrale Hinweisseite
                  </p>
                )}
              </div>
              <Link
                href={`/${document.slug}`}
                className="text-sm text-aw-gold hover:underline"
              >
                Öffnen →
              </Link>
            </li>
          ))}
          <li className="flex items-center justify-between rounded-xl border border-aw-border bg-aw-surface px-5 py-4">
            <Link
              href="/widerrufsformular"
              className="font-semibold text-aw-cream hover:text-aw-gold"
            >
              Widerrufsformular
            </Link>
            <Link
              href="/widerrufsformular"
              className="text-sm text-aw-gold hover:underline"
            >
              Öffnen →
            </Link>
          </li>
        </ul>
      </section>
    </>
  );
}
