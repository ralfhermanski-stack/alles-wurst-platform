import type { Metadata } from "next";

import ContactForm from "@/components/marketing/ContactForm";
import PageHeader from "@/components/marketing/PageHeader";
import { buildStaticPageMetadata } from "@/lib/page-seo/page-seo-static-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildStaticPageMetadata("/kontakt", {
    title: "Kontakt",
    description: "Nimm Kontakt mit dem Alles-Wurst-Team auf.",
  });
}

export default function KontaktPage() {
  return (
    <>
      <PageHeader
        eyebrow="Kontakt"
        title="Wir freuen uns auf deine Nachricht"
        description="Fragen zu Kursen, Mitgliedschaft oder Werkzeugen? Schreib uns — wir melden uns in der Regel innerhalb von 24–48 Stunden."
      />

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <ContactForm />

          <aside className="space-y-6">
            <div className="rounded-xl border border-aw-border bg-aw-surface p-6">
              <h2 className="font-display text-lg font-bold text-aw-cream">
                Support
              </h2>
              <p className="mt-2 text-sm text-aw-muted">
                Für konkrete Anliegen als Mitglied nutze bitte auch das
                Support-System im Mitgliederbereich.
              </p>
              <p className="mt-4 text-sm text-aw-cream/90">
                support@alles-wurst.de
              </p>
            </div>
            <div className="rounded-xl border border-aw-border bg-aw-surface p-6">
              <h2 className="font-display text-lg font-bold text-aw-cream">
                Antwortzeit
              </h2>
              <p className="mt-2 text-sm text-aw-muted">
                In der Regel innerhalb von 24–48 Stunden (Werktage).
              </p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
