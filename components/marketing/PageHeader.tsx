import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  imageSrc?: string;
  imageAlt?: string;
  backgroundImage?: ReactNode;
};

/**
 * Einheitlicher Seitenkopf für innere Marketing-Seiten.
 */
export default function PageHeader({
  eyebrow,
  title,
  description,
  imageSrc,
  imageAlt,
  backgroundImage,
}: PageHeaderProps) {
  const hasBackground = Boolean(imageSrc || backgroundImage);

  return (
    <div
      className={`relative overflow-hidden border-b border-aw-border bg-aw-surface/40 ${
        hasBackground ? "min-h-[320px] sm:min-h-[400px] lg:min-h-[440px]" : ""
      }`}
    >
      {backgroundImage ? (
        <div
          aria-hidden="true"
          className="absolute inset-0 z-0 min-h-[320px] sm:min-h-[400px] lg:min-h-[440px]"
        >
          <div className="relative min-h-[320px] w-full sm:min-h-[400px] lg:min-h-[440px]">
            {backgroundImage}
          </div>
        </div>
      ) : (
        imageSrc && (
          <div
            aria-hidden="true"
            className="absolute inset-0 z-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${imageSrc})` }}
          />
        )
      )}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(70%_120%_at_0%_-20%,rgba(212,175,55,0.12),transparent_60%)]"
      />
      {hasBackground && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-r from-aw-bg/55 via-aw-bg/25 to-transparent"
        />
      )}

      {imageAlt && hasBackground && <span className="sr-only">{imageAlt}</span>}

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-14 sm:px-6">
        {eyebrow && (
          <p className="mb-3 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.25em] text-aw-gold">
            <span className="h-px w-6 bg-aw-gold/60" aria-hidden="true" />
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-3xl font-bold text-aw-cream sm:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-4 max-w-2xl text-base leading-7 text-aw-muted">{description}</p>
        )}
      </div>
    </div>
  );
}
