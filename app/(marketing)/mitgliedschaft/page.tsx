import type { Metadata } from "next";
import Link from "next/link";

import PageHeader from "@/components/marketing/PageHeader";
import MembershipCard from "@/components/cards/MembershipCard";
import { getCheckoutUiProviders } from "@/lib/payments/checkout-query-service";
import { listMembershipMarketingPlans } from "@/lib/membership/membership-marketing";
import { buildStaticPageMetadata } from "@/lib/page-seo/page-seo-static-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildStaticPageMetadata("/mitgliedschaft", {
    title: "Mitgliedschaft",
    description:
      "Wurst Club und Meisterklasse — monatlich oder jährlich buchen und direkt per Stripe bezahlen.",
  });
}

const faqs = [
  {
    q: "Monatlich oder jährlich?",
    a: "Die Monatsabos sind ideal zum Reinschnuppern. Mit den Jahresmitgliedschaften sparst du deutlich und schaltest zusätzliche Inhalte frei.",
  },
  {
    q: "Kann ich jederzeit kündigen?",
    a: "Ja. Monatsabos sind monatlich kündbar, Jahresmitgliedschaften laufen zum Ende der Laufzeit aus. Deine Zertifikate bleiben erhalten.",
  },
  {
    q: "Wie funktioniert die Zahlung?",
    a: "Nach der Auswahl wirst du zum sicheren Stripe-Checkout weitergeleitet. Dein Zugang wird automatisch freigeschaltet, sobald die Zahlung bestätigt ist.",
  },
];

export default async function MitgliedschaftPage() {
  const [{ plans, error }, providers] = await Promise.all([
    listMembershipMarketingPlans(),
    getCheckoutUiProviders(),
  ]);
  const hasStripe = providers.includes("stripe");

  return (
    <>
      <PageHeader
        eyebrow="Mitgliedschaft"
        title="Wähle deinen Weg zum Handwerk"
        description={
          hasStripe
            ? "Vier Stufen — vom Einstieg im Wurst Club bis zur Meisterklasse. Sichere Online-Zahlung per Stripe."
            : "Vier Stufen — vom Einstieg im Wurst Club bis zur Meisterklasse. Alle Preise inkl. MwSt."
        }
      />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        {error && (
          <p className="mb-8 rounded-lg border border-aw-warning/40 bg-aw-warning/10 px-4 py-3 text-sm text-aw-warning">
            {error}
          </p>
        )}

        {plans.length === 0 && !error && (
          <p className="text-center text-sm text-aw-muted">
            Aktuell sind keine Mitgliedschaften im Katalog hinterlegt.
          </p>
        )}

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => (
            <MembershipCard key={plan.slug} plan={plan} />
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-aw-muted">
          {hasStripe
            ? "Für den Checkout ist ein Konto erforderlich. Nach erfolgreicher Zahlung wird deine Mitgliedschaft automatisch freigeschaltet."
            : "Stripe ist derzeit nicht konfiguriert — Buchung über Überweisung oder manuelle Freigabe."}{" "}
          <Link href="/anmelden" className="font-semibold text-aw-gold hover:text-aw-cream">
            Anmelden
          </Link>
        </p>
      </section>

      <section className="border-t border-aw-border bg-aw-surface/40">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <h2 className="font-display text-2xl font-bold text-aw-cream">
            Häufige Fragen
          </h2>
          <dl className="mt-8 space-y-6">
            {faqs.map((f) => (
              <div key={f.q} className="rounded-xl border border-aw-border bg-aw-surface p-5">
                <dt className="font-semibold text-aw-cream">{f.q}</dt>
                <dd className="mt-2 text-sm leading-6 text-aw-muted">{f.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </>
  );
}
