import type { Metadata } from "next";
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
        description="Fragen zu Kursen, Mitgliedschaft oder Werkzeugen? Schreib uns – das Formular ist im Prototyp noch ohne Versandfunktion."
      />

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          {/* Formular (Platzhalter, kein Submit) */}
          <form className="space-y-5" aria-label="Kontaktformular (Demo)">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-aw-cream">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Dein Name"
                  className="mt-2 w-full rounded-md border border-aw-border bg-aw-surface px-3 py-2.5 text-sm text-aw-cream placeholder:text-aw-muted/70 focus:border-aw-gold"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-aw-cream">
                  E-Mail
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="du@beispiel.de"
                  className="mt-2 w-full rounded-md border border-aw-border bg-aw-surface px-3 py-2.5 text-sm text-aw-cream placeholder:text-aw-muted/70 focus:border-aw-gold"
                />
              </div>
            </div>
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-aw-cream">
                Betreff
              </label>
              <input
                id="subject"
                type="text"
                placeholder="Worum geht es?"
                className="mt-2 w-full rounded-md border border-aw-border bg-aw-surface px-3 py-2.5 text-sm text-aw-cream placeholder:text-aw-muted/70 focus:border-aw-gold"
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-aw-cream">
                Nachricht
              </label>
              <textarea
                id="message"
                rows={6}
                placeholder="Deine Nachricht …"
                className="mt-2 w-full rounded-md border border-aw-border bg-aw-surface px-3 py-2.5 text-sm text-aw-cream placeholder:text-aw-muted/70 focus:border-aw-gold"
              />
            </div>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md bg-aw-gold px-6 py-3 text-sm font-semibold text-aw-bg transition-colors hover:bg-aw-gold-dark hover:text-aw-cream"
            >
              Nachricht senden
            </button>
          </form>

          {/* Kontaktinfos */}
          <aside className="space-y-6">
            <div className="rounded-xl border border-aw-border bg-aw-surface p-6">
              <h2 className="font-display text-lg font-bold text-aw-cream">Support</h2>
              <p className="mt-2 text-sm text-aw-muted">
                Für konkrete Anliegen nutze bitte das Support-System im Mitgliederbereich.
              </p>
              <p className="mt-4 text-sm text-aw-cream/90">support@alles-wurst.de</p>
            </div>
            <div className="rounded-xl border border-aw-border bg-aw-surface p-6">
              <h2 className="font-display text-lg font-bold text-aw-cream">Antwortzeit</h2>
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
