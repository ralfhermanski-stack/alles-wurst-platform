"use client";

import Link from "next/link";

import Icon from "@/components/brand/Icon";
import type { HomepageSocialCard } from "@/lib/social-media/social-media-types";

type SocialPlatformCardViewProps = {
  platform: HomepageSocialCard;
  followerLabel?: string;
};

function formatFollowerCount(count: number): string {
  return new Intl.NumberFormat("de-DE").format(count);
}

export default function SocialPlatformCardView({
  platform,
  followerLabel = "Abonnenten",
}: SocialPlatformCardViewProps) {
  const href = platform.latestPostUrl ?? platform.profileUrl;

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-aw-border bg-aw-surface transition-all hover:-translate-y-1 hover:border-aw-gold/50 hover:shadow-[0_18px_40px_-24px_rgba(212,175,55,0.5)]"
      aria-label={`${platform.publicName} – externer Link`}
    >
      <div
        className={`relative flex h-36 items-end overflow-hidden bg-gradient-to-br ${platform.accent} to-aw-bg p-4`}
      >
        {platform.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={platform.coverImageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-60"
          />
        ) : null}

        <div className="relative z-10 flex w-full gap-2">
          {platform.previewItems.map((item) => (
            <div
              key={item.label}
              className="relative flex h-20 flex-1 items-end overflow-hidden rounded-lg bg-aw-bg/50 p-2 ring-1 ring-aw-border/60"
            >
              {item.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.thumbnailUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover opacity-80"
                />
              ) : null}
              <span className="relative z-10 line-clamp-2 text-[10px] font-medium text-aw-cream/90">
                {item.label}
              </span>
            </div>
          ))}
        </div>

        <Icon
          name={platform.icon}
          className="pointer-events-none absolute -right-3 top-3 h-24 w-24 text-aw-cream/[0.06]"
        />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-aw-surface-2 text-aw-gold ring-1 ring-aw-border">
            <Icon name={platform.icon} className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-display text-base font-bold text-aw-cream">
              {platform.publicName}
            </h3>
            {platform.showFollowerCount && platform.followerCount !== null && (
              <p className="text-xs font-semibold text-aw-gold">
                {formatFollowerCount(platform.followerCount)} {followerLabel}
              </p>
            )}
          </div>
        </div>

        {platform.description && (
          <p className="mt-4 flex-1 text-sm leading-6 text-aw-muted line-clamp-3">
            {platform.description}
          </p>
        )}

        <p className="mt-4 text-xs font-semibold text-aw-gold group-hover:text-aw-cream">
          {platform.ctaLabel} ↗
        </p>
      </div>
    </Link>
  );
}
