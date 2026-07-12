import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

type HeroProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle: ReactNode;
  primaryCta?: { label: ReactNode; href: string };
  secondaryCta?: { label: ReactNode; href: string };
  stats?: { key: string; value: ReactNode; label: ReactNode }[];
  /** Hintergrundbild (z. B. PlatformImage) */
  backgroundImage?: ReactNode;
  /** Logo rechts (z. B. PlatformImage) */
  logoImage?: ReactNode;
  /** Fallback wenn keine backgroundImage-Komponente übergeben wird */
  imageSrc?: string;
  imageAlt?: string;
  logoSrc?: string;
};

/**
 * Wiederverwendbarer Hero-Block im dunklen Markenstil mit Gold-Akzenten.
 * Optional mit Hintergrundbild (imageSrc) inkl. dunklem Verlauf-Overlay für Lesbarkeit.
 */
export default function Hero({
  eyebrow,
  title,
  subtitle,
  primaryCta,
  secondaryCta,
  stats,
  backgroundImage,
  logoImage,
  imageSrc,
  imageAlt = "",
  logoSrc,
}: HeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-aw-border">
      {backgroundImage ? (
        <div aria-hidden="true" className="absolute inset-0 z-0">
          {backgroundImage}
          <div className="absolute inset-0 bg-gradient-to-r from-black/35 via-black/12 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-black/8 to-transparent" />
        </div>
      ) : imageSrc ? (
        <div aria-hidden="true" className="absolute inset-0 z-0">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/35 via-black/12 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-black/8 to-transparent" />
        </div>
      ) : null}

      {/* Dekorative Gold-Glut im Hintergrund */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(60%_60%_at_50%_-10%,rgba(212,175,55,0.16),transparent_60%)]"
      />

      {/* Markenlogo rechts neben dem Hero-Text (ab großen Bildschirmen) */}
      {logoImage ? (
        <div
          className="absolute inset-y-0 right-0 z-[5] hidden w-[46%] items-center justify-center pr-6 lg:flex xl:pr-10"
        >
          <div className="relative h-80 w-72 max-w-full xl:w-80">{logoImage}</div>
        </div>
      ) : logoSrc ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 hidden w-[46%] items-center justify-center pr-6 lg:flex xl:pr-10"
        >
          <Image
            src={logoSrc}
            alt=""
            width={1024}
            height={1024}
            priority
            className="w-72 max-w-full drop-shadow-[0_10px_40px_rgba(0,0,0,0.55)] xl:w-80"
          />
        </div>
      ) : null}
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="max-w-3xl">
          {eyebrow && (
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-aw-gold/40 bg-aw-gold/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-aw-gold">
              {eyebrow}
            </p>
          )}
          <h1 className="font-display text-4xl font-bold leading-tight text-aw-cream sm:text-5xl md:text-6xl">
            {title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-aw-muted">{subtitle}</p>

          {(primaryCta || secondaryCta) && (
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {primaryCta && (
                <Link
                  href={primaryCta.href}
                  className="inline-flex items-center justify-center rounded-md bg-aw-gold px-6 py-3 text-sm font-semibold text-aw-bg transition-colors hover:bg-aw-gold-dark hover:text-aw-cream"
                >
                  {primaryCta.label}
                </Link>
              )}
              {secondaryCta && (
                <Link
                  href={secondaryCta.href}
                  className="inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-semibold text-aw-cream ring-1 ring-aw-border backdrop-blur-sm transition-colors hover:bg-aw-surface-2"
                >
                  {secondaryCta.label}
                </Link>
              )}
            </div>
          )}
        </div>

        {stats && (
          <dl className="mt-16 grid max-w-2xl grid-cols-2 gap-8 sm:grid-cols-3">
            {stats.map((s) => (
              <div key={s.key}>
                <dt className="font-display text-3xl font-bold text-aw-gold">{s.value}</dt>
                <dd className="mt-1 text-sm text-aw-muted">{s.label}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}
