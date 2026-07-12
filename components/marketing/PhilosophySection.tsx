import Image from "next/image";
import Link from "next/link";

import Icon from "@/components/brand/Icon";
import PlatformText from "@/components/platform-text/PlatformText";
import type { PhilosophyValue } from "@/lib/placeholder-data";

type PhilosophySectionProps = {
  values: PhilosophyValue[];
  quote: string;
};

const VALUE_TEXT_KEYS = [
  {
    title: "home.philosophy.value1.title",
    description: "home.philosophy.value1.description",
  },
  {
    title: "home.philosophy.value2.title",
    description: "home.philosophy.value2.description",
  },
  {
    title: "home.philosophy.value3.title",
    description: "home.philosophy.value3.description",
  },
  {
    title: "home.philosophy.value4.title",
    description: "home.philosophy.value4.description",
  },
  {
    title: "home.philosophy.value5.title",
    description: "home.philosophy.value5.description",
  },
] as const;

/**
 * Emotionale Philosophie-Sektion für die Startseite.
 */
export default function PhilosophySection({ values, quote }: PhilosophySectionProps) {
  return (
    <section className="relative overflow-hidden border-y border-aw-border bg-aw-surface/40">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_20%_50%,rgba(212,175,55,0.06),transparent)]"
      />

      <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <div className="relative mx-auto w-full max-w-md lg:mx-0 lg:max-w-none">
            <div className="relative overflow-hidden rounded-2xl ring-1 ring-aw-gold/25 shadow-[0_32px_64px_-24px_rgba(0,0,0,0.6)]">
              <div className="relative aspect-[4/5] sm:aspect-[3/4]">
                <Image
                  src="/philosophy-portrait.png"
                  alt="Ralf Hermanski – Fleischermeister seit 1994"
                  fill
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  className="object-cover object-top"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-aw-bg via-transparent to-aw-bg/20" />
                <div className="absolute inset-0 bg-gradient-to-r from-aw-bg/30 via-transparent to-aw-bg/30" />
              </div>
            </div>

            <figcaption className="mt-6 text-center lg:text-left">
              <PlatformText
                textKey="home.philosophy.portrait.name"
                fallback="Ralf Hermanski"
                elementType="text"
                as="p"
                className="font-display text-xl font-bold text-aw-cream sm:text-2xl"
              />
              <PlatformText
                textKey="home.philosophy.portrait.role"
                fallback="Fleischermeister seit 1994"
                elementType="text"
                as="p"
                className="mt-1 text-sm font-semibold tracking-wide text-aw-gold"
              />
              <PlatformText
                textKey="home.philosophy.portrait.tagline"
                fallback="Handwerk • Wissen • Praxis"
                elementType="text"
                as="p"
                className="mt-2 text-xs font-medium uppercase tracking-[0.2em] text-aw-muted"
              />
            </figcaption>

            <span
              aria-hidden="true"
              className="mt-6 block h-px bg-gradient-to-r from-transparent via-aw-gold/50 to-transparent lg:from-aw-gold/50 lg:via-aw-gold/30 lg:to-transparent"
            />
          </div>

          <div>
            <PlatformText
              textKey="home.philosophy.eyebrow"
              fallback="Philosophie"
              elementType="subheading"
              as="p"
              className="text-xs font-medium uppercase tracking-[0.25em] text-aw-gold"
            />
            <h2 className="mt-3 font-display text-3xl font-bold leading-tight text-aw-cream sm:text-4xl lg:text-[2.75rem]">
              <PlatformText
                textKey="home.philosophy.title_line1"
                fallback="Warum ich tue,"
                elementType="heading"
                as="span"
              />
              <br />
              <PlatformText
                textKey="home.philosophy.title_line2"
                fallback="was ich tue."
                elementType="heading"
                as="span"
              />
            </h2>
            <div className="mt-6 space-y-4 text-base leading-8 text-aw-muted">
              <PlatformText
                textKey="home.philosophy.intro1"
                fallback="Gutes Essen beginnt mit Wissen."
                elementType="text"
                as="p"
              />
              <PlatformText
                textKey="home.philosophy.intro2"
                fallback="Ich glaube, dass jeder verstehen sollte, was in seinen Lebensmitteln steckt. Deshalb zeige ich dir Schritt für Schritt, wie du eigene Wurst, Schinken, Marinaden und Spezialitäten herstellst – bewusst, nachvollziehbar und mit deinem ganz persönlichen Geschmack."
                elementType="text"
                as="p"
              />
            </div>
          </div>
        </div>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-5 lg:gap-4">
          {values.map((value, index) => {
            const keys = VALUE_TEXT_KEYS[index];

            if (!keys) {
              return null;
            }

            return (
              <article
                key={value.title}
                className="group flex flex-col rounded-xl border border-aw-border bg-aw-surface/80 p-5 transition-colors hover:border-aw-gold/30"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-aw-gold/10 text-aw-gold ring-1 ring-aw-gold/20">
                  <Icon name={value.icon} className="h-5 w-5" />
                </span>
                <span
                  aria-hidden="true"
                  className="mt-4 font-display text-2xl font-bold text-aw-gold/20"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-1 font-display text-base font-bold leading-snug text-aw-cream">
                  <PlatformText
                    textKey={keys.title}
                    fallback={value.title}
                    elementType="heading"
                    as="span"
                  />
                </h3>
                <PlatformText
                  textKey={keys.description}
                  fallback={value.description}
                  elementType="text"
                  as="p"
                  className="mt-2 flex-1 text-sm leading-6 text-aw-muted"
                />
              </article>
            );
          })}
        </div>

        <blockquote className="relative mx-auto mt-16 max-w-3xl text-center">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 font-display text-7xl leading-none text-aw-gold/15"
          >
            „
          </span>
          <PlatformText
            textKey="home.philosophy.quote"
            fallback={quote}
            elementType="text"
            as="p"
            className="relative font-display text-xl font-medium leading-relaxed text-aw-cream sm:text-2xl sm:leading-relaxed lg:text-[1.65rem] lg:leading-relaxed"
          />
        </blockquote>

        <div className="mt-12 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/philosophie"
            className="inline-flex items-center justify-center rounded-md bg-aw-gold px-6 py-3 text-sm font-semibold text-aw-bg transition-colors hover:bg-aw-gold-dark hover:text-aw-cream"
          >
            <PlatformText
              textKey="home.philosophy.cta_primary"
              fallback="Unsere Philosophie"
              elementType="button"
              as="span"
            />
          </Link>
          <Link
            href="/akademie/kurse"
            className="inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-semibold text-aw-cream ring-1 ring-aw-border transition-colors hover:bg-aw-surface-2"
          >
            <PlatformText
              textKey="home.philosophy.cta_secondary"
              fallback="Kurse entdecken"
              elementType="button"
              as="span"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
