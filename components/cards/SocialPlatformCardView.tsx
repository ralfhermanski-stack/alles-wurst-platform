"use client";

import Link from "next/link";

import Icon from "@/components/brand/Icon";
import type { HomepageSocialCard } from "@/lib/social-media/social-media-types";

type SocialPlatformCardViewProps = {
  platform: HomepageSocialCard;
  followerLabel?: string;
  /** Spotlight: volle Breite / Zwei-Spalten-CTA (ein Kanal). */
  variant?: "card" | "spotlight";
};

function formatFollowerCount(count: number): string {
  return new Intl.NumberFormat("de-DE").format(count);
}

/** Marken-Mosaik statt leerer Feed-Platzhalter. */
const BRAND_MOSAIC = [
  { label: "Rezepte", tone: "from-aw-gold/30 to-aw-brown/50" },
  { label: "Werkstatt", tone: "from-aw-brown/45 to-aw-bg" },
  { label: "Einblicke", tone: "from-aw-surface-2 to-aw-gold/20" },
] as const;

function BrandVisual({
  platform,
  tall,
}: {
  platform: HomepageSocialCard;
  tall?: boolean;
}) {
  const heightClass = tall ? "min-h-[220px] sm:min-h-[280px]" : "h-40";

  return (
    <div
      className={`relative flex items-end overflow-hidden bg-gradient-to-br ${platform.accent} to-aw-bg p-4 ${heightClass}`}
    >
      {platform.coverImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={platform.coverImageUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-70"
        />
      ) : null}

      <div className="absolute inset-0 bg-gradient-to-t from-aw-bg/80 via-aw-bg/20 to-transparent" />

      {platform.hasMediaPreviews && platform.previewItems.length > 0 ? (
        <div className="relative z-10 flex w-full gap-2">
          {platform.previewItems.map((item) => (
            <div
              key={`${item.label}-${item.thumbnailUrl ?? "empty"}`}
              className="relative flex h-20 flex-1 items-end overflow-hidden rounded-lg bg-aw-bg/50 p-2 ring-1 ring-aw-border/60"
            >
              {item.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.thumbnailUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover opacity-85"
                />
              ) : null}
              <span className="relative z-10 line-clamp-2 text-[10px] font-medium text-aw-cream/90">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="relative z-10 flex w-full gap-2">
          {BRAND_MOSAIC.map((tile) => (
            <div
              key={tile.label}
              className={`relative flex h-20 flex-1 items-end overflow-hidden rounded-lg bg-gradient-to-br ${tile.tone} p-2 ring-1 ring-aw-gold/20`}
            >
              <span className="relative z-10 text-[10px] font-semibold uppercase tracking-wider text-aw-cream/80">
                {tile.label}
              </span>
            </div>
          ))}
        </div>
      )}

      <Icon
        name={platform.icon}
        className="pointer-events-none absolute -right-3 top-3 h-24 w-24 text-aw-gold/[0.08]"
      />
    </div>
  );
}

function CardBody({
  platform,
  followerLabel,
  spotlight,
}: {
  platform: HomepageSocialCard;
  followerLabel: string;
  spotlight?: boolean;
}) {
  return (
    <div className={`flex flex-1 flex-col ${spotlight ? "p-6 sm:p-8" : "p-5"}`}>
      <div className="flex items-center gap-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-aw-gold/15 text-aw-gold ring-1 ring-aw-gold/30">
          <Icon name={platform.icon} className="h-5 w-5" />
        </span>
        <div>
          <h3
            className={`font-display font-bold text-aw-cream ${
              spotlight ? "text-xl sm:text-2xl" : "text-base"
            }`}
          >
            {platform.publicName}
          </h3>
          {platform.showFollowerCount && platform.followerCount !== null && (
            <p className="text-xs font-semibold text-aw-gold">
              {formatFollowerCount(platform.followerCount)} {followerLabel}
            </p>
          )}
        </div>
      </div>

      {platform.description ? (
        <p
          className={`mt-4 flex-1 text-sm leading-6 text-aw-muted ${
            spotlight ? "sm:text-base sm:leading-7" : "line-clamp-3"
          }`}
        >
          {platform.description}
        </p>
      ) : spotlight ? (
        <p className="mt-4 flex-1 text-sm leading-6 text-aw-muted sm:text-base sm:leading-7">
          Frische Inspiration aus der Werkstatt — direkt auf unserem Profil.
        </p>
      ) : null}

      {spotlight ? (
        <span className="mt-6 inline-flex w-fit items-center justify-center rounded-md bg-aw-gold px-5 py-2.5 text-sm font-semibold text-aw-bg transition-colors group-hover:bg-aw-gold-dark group-hover:text-aw-cream">
          {platform.ctaLabel} ↗
        </span>
      ) : (
        <p className="mt-4 text-xs font-semibold text-aw-gold group-hover:text-aw-cream">
          {platform.ctaLabel} ↗
        </p>
      )}
    </div>
  );
}

export default function SocialPlatformCardView({
  platform,
  followerLabel = "Abonnenten",
  variant = "card",
}: SocialPlatformCardViewProps) {
  const href = platform.latestPostUrl ?? platform.profileUrl;

  if (variant === "spotlight") {
    return (
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="group grid overflow-hidden rounded-2xl border border-aw-gold/30 bg-gradient-to-b from-aw-gold/10 to-aw-surface transition-all hover:border-aw-gold/50 hover:shadow-[0_18px_40px_-24px_rgba(212,175,55,0.45)] lg:grid-cols-2"
        aria-label={`${platform.publicName} – externer Link`}
      >
        <BrandVisual platform={platform} tall />
        <CardBody platform={platform} followerLabel={followerLabel} spotlight />
      </Link>
    );
  }

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-aw-border bg-aw-surface transition-all hover:-translate-y-1 hover:border-aw-gold/50 hover:shadow-[0_18px_40px_-24px_rgba(212,175,55,0.5)]"
      aria-label={`${platform.publicName} – externer Link`}
    >
      <BrandVisual platform={platform} />
      <CardBody platform={platform} followerLabel={followerLabel} />
    </Link>
  );
}
