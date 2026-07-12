import Link from "next/link";

import EditablePageHeader from "@/components/marketing/EditablePageHeader";
import PhilosophyCard, {
  resolvePhilosophyCardCaption,
} from "@/components/marketing/PhilosophyCard";
import PlatformText from "@/components/platform-text/PlatformText";
import { PHILOSOPHY_CARDS } from "@/lib/philosophy/philosophy-cards";

/**
 * Vollständige Philosophie-Seite mit sechs Bild-Karten und administrierbaren Platzhaltern.
 */
export default async function PhilosophyPageContent() {
  const cardsWithCaptions = await Promise.all(
    PHILOSOPHY_CARDS.map(async (card) => ({
      card,
      caption: await resolvePhilosophyCardCaption(card),
    })),
  );

  return (
    <>
      <EditablePageHeader
        eyebrowKey="philosophy.header.eyebrow"
        titleKey="philosophy.header.title"
        descriptionKey="philosophy.header.description"
        imageKey="philosophy.header.image"
        imageAltKey="philosophy.header.image_alt"
        fallbacks={{
          eyebrow: "Philosophie",
          title: "Meine Philosophie",
          description:
            "Handwerk mit Haltung — sechs Grundsätze, die jede Rezeptur, jeden Kurs und jede Beratung bei Alles Wurst prägen.",
          image: "/images/philosophy/header.png",
          imageAlt:
            "Handwerkliche Zutaten auf dem Werktisch — Kräuter, Gewürze und Salz in traditioneller Küche",
        }}
      />

      <section className="border-b border-aw-border bg-aw-surface/30">
        <div className="mx-auto max-w-3xl px-4 py-14 text-center sm:px-6 lg:py-16">
          <PlatformText
            textKey="philosophy.intro.title"
            fallback="Was uns antreibt"
            elementType="heading"
            as="h2"
            className="font-display text-2xl font-bold text-aw-cream sm:text-3xl"
          />
          <div className="mt-5 space-y-4 text-base leading-8 text-aw-muted">
            <PlatformText
              textKey="philosophy.intro.text1"
              fallback="Gutes Essen beginnt mit Wissen und Verantwortung."
              elementType="text"
              as="p"
            />
            <PlatformText
              textKey="philosophy.intro.text2"
              fallback="Ich zeige dir Schritt für Schritt, wie du Wurst, Schinken und Spezialitäten bewusst herstellst — mit Respekt vor dem Produkt, klaren Zutaten und deinem persönlichen Geschmack."
              elementType="text"
              as="p"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <PlatformText
            textKey="philosophy.cards.eyebrow"
            fallback="Unsere Grundsätze"
            elementType="subheading"
            as="p"
            className="text-xs font-medium uppercase tracking-[0.25em] text-aw-gold"
          />
          <PlatformText
            textKey="philosophy.cards.title"
            fallback="Sechs Säulen unseres Handwerks"
            elementType="heading"
            as="h2"
            className="mt-3 font-display text-3xl font-bold text-aw-cream sm:text-4xl"
          />
          <PlatformText
            textKey="philosophy.cards.description"
            fallback="Jede Karte kann im Adminbereich mit finalem Foto, Alternativtext und optionaler Bildunterschrift befüllt werden."
            elementType="text"
            as="p"
            className="mt-4 text-sm leading-7 text-aw-muted sm:text-base"
          />
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {cardsWithCaptions.map(({ card, caption }) => (
            <PhilosophyCard key={card.index} card={card} caption={caption} />
          ))}
        </div>
      </section>

      <section className="border-y border-aw-border bg-aw-surface/40">
        <blockquote className="relative mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:py-20">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-6 -translate-x-1/2 font-display text-7xl leading-none text-aw-gold/15"
          >
            „
          </span>
          <PlatformText
            textKey="philosophy.quote"
            fallback="Wer versteht, was in seinem Essen steckt, entscheidet bewusster, genießt intensiver und wird unabhängiger."
            elementType="text"
            as="p"
            className="relative font-display text-xl font-medium leading-relaxed text-aw-cream sm:text-2xl sm:leading-relaxed"
          />
        </blockquote>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-16">
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/akademie/kurse"
            className="inline-flex items-center justify-center rounded-md bg-aw-gold px-6 py-3 text-sm font-semibold text-aw-bg transition-colors hover:bg-aw-gold-dark hover:text-aw-cream"
          >
            <PlatformText
              textKey="philosophy.cta.primary"
              fallback="Kurse entdecken"
              elementType="button"
              as="span"
            />
          </Link>
          <Link
            href="/mitgliedschaft"
            className="inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-semibold text-aw-cream ring-1 ring-aw-border transition-colors hover:bg-aw-surface-2"
          >
            <PlatformText
              textKey="philosophy.cta.secondary"
              fallback="Mitgliedschaft wählen"
              elementType="button"
              as="span"
            />
          </Link>
        </div>
      </section>
    </>
  );
}
