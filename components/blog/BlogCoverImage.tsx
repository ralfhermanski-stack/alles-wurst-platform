"use client";

import { useState } from "react";

import Icon from "@/components/brand/Icon";

const FALLBACK_SRC = "/images/magazin-cover-fallback.svg";

type BlogCoverImageProps = {
  src: string | null;
  alt: string;
  className?: string;
  aspectClassName?: string;
  priority?: boolean;
};

/**
 * Beitragsbild mit Fallback, wenn die URL fehlt oder nicht lädt.
 */
export default function BlogCoverImage({
  src,
  alt,
  className = "h-full w-full object-cover",
  aspectClassName = "aspect-[16/9]",
  priority = false,
}: BlogCoverImageProps) {
  const [failed, setFailed] = useState(false);
  const showFallback = !src || failed;

  return (
    <div
      className={`relative overflow-hidden bg-aw-surface-2 ${aspectClassName}`}
    >
      {showFallback ? (
        <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-aw-brown/50 via-aw-surface-2 to-aw-bg p-6 text-center">
          <Icon name="book" className="h-16 w-16 text-aw-gold/30" aria-hidden />
          <p className="mt-3 text-sm font-medium text-aw-muted">Alles-Wurst Magazin</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={FALLBACK_SRC}
            alt=""
            aria-hidden
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-20"
          />
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className={className}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 90vw, 768px"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}

export { FALLBACK_SRC };
