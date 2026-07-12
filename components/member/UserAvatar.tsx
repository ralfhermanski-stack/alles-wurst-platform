import Icon from "@/components/brand/Icon";
import {
  getPublicAvatarInitials,
  getPublicAvatarUrl,
} from "@/lib/users/public-user";

type UserAvatarProps = {
  profile?: {
    publicName?: string | null;
    firstName?: string | null;
    avatarUrl?: string | null;
  } | null;
  size?: "sm" | "md";
  className?: string;
};

const sizeClasses = {
  sm: "h-7 w-7 text-xs",
  md: "h-10 w-10 text-sm",
} as const;

/**
 * Öffentlicher Avatar mit Bild, Initialen oder Alles-Wurst-Fallback.
 */
export default function UserAvatar({
  profile,
  size = "md",
  className = "",
}: UserAvatarProps) {
  const userInput = { profile };
  const avatarUrl = getPublicAvatarUrl(userInput);
  const initials = getPublicAvatarInitials(userInput);
  const sizeClass = sizeClasses[size];
  const hasCustomPublicIdentity = Boolean(
    profile?.publicName?.trim() || profile?.firstName?.trim(),
  );

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt=""
        className={`${sizeClass} rounded-full border border-aw-border object-cover ${className}`}
      />
    );
  }

  if (!hasCustomPublicIdentity) {
    return (
      <span
        className={`flex ${sizeClass} items-center justify-center rounded-full border border-aw-gold/40 bg-aw-gold/10 text-aw-gold ${className}`}
        aria-hidden="true"
      >
        <Icon name="sausage" className={size === "sm" ? "h-4 w-4" : "h-5 w-5"} />
      </span>
    );
  }

  return (
    <span
      className={`flex ${sizeClass} items-center justify-center rounded-full border border-aw-border bg-aw-charcoal font-semibold text-aw-gold ${className}`}
      aria-hidden="true"
    >
      {initials || "?"}
    </span>
  );
}
