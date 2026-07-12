"use client";

import Icon from "@/components/brand/Icon";
import { getInitialsFromLabel } from "@/lib/users/public-user";

type StarRatingProps = {
  value: number;
  onChange?: (value: number) => void;
  size?: "sm" | "md";
};

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <span className={filled ? "text-aw-gold" : "text-aw-muted/40"} aria-hidden="true">
      ★
    </span>
  );
}

export default function StarRating({
  value,
  onChange,
  size = "md",
}: StarRatingProps) {
  const sizeClass = size === "sm" ? "text-base" : "text-2xl";

  return (
    <div className={`flex gap-1 ${sizeClass}`} role="group" aria-label="Sternebewertung">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= value;

        if (onChange) {
          return (
            <button
              key={star}
              type="button"
              className="transition hover:scale-110"
              onClick={() => onChange(star)}
              aria-label={`${star} von 5 Sternen`}
            >
              <StarIcon filled={filled} />
            </button>
          );
        }

        return (
          <span key={star} aria-hidden="true">
            <StarIcon filled={filled} />
          </span>
        );
      })}
    </div>
  );
}

export function ReviewAvatar({
  displayName,
  avatarUrl,
}: {
  displayName: string;
  avatarUrl: string | null;
}) {
  const initials = getInitialsFromLabel(displayName);

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt=""
        className="h-10 w-10 rounded-full border border-aw-border object-cover"
      />
    );
  }

  if (displayName === "Wurstfreund") {
    return (
      <span className="flex h-10 w-10 items-center justify-center rounded-full border border-aw-gold/40 bg-aw-gold/10 text-aw-gold">
        <Icon name="sausage" className="h-5 w-5" />
      </span>
    );
  }

  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-aw-border bg-aw-charcoal text-sm font-semibold text-aw-gold">
      {initials || "?"}
    </span>
  );
}
