import Image from "next/image";
import Link from "next/link";

type LogoVariant = "horizontal" | "stacked";

type LogoProps = {
  href?: string;
  variant?: LogoVariant;
  className?: string;
  priority?: boolean;
};

const sources: Record<
  LogoVariant,
  { src: string; width: number; height: number; alt: string }
> = {
  horizontal: {
    src: "/logo-horizontal.png",
    width: 731,
    height: 221,
    alt: "Alles Wurst",
  },
  stacked: {
    src: "/logo-stacked.png",
    width: 1024,
    height: 1024,
    alt: "Alles Wurst – The Crest of Craftsmanship",
  },
};

/**
 * Marken-Logo als offizielles Bildasset.
 * - horizontal: Wappen + Wortmarke (für Header/Topbar/Sidebar)
 * - stacked: vollständiges Wappen mit Claim (für Footer)
 */
export default function Logo({
  href = "/",
  variant = "horizontal",
  className,
  priority = false,
}: LogoProps) {
  const s = sources[variant];
  const sizeClass =
    className ?? (variant === "stacked" ? "h-28 w-auto" : "h-11 w-auto sm:h-12");

  return (
    <Link
      href={href}
      className="inline-flex items-center transition-opacity hover:opacity-90"
      aria-label="Alles-Wurst – zur Startseite"
    >
      <Image
        src={s.src}
        width={s.width}
        height={s.height}
        alt={s.alt}
        priority={priority}
        className={sizeClass}
      />
    </Link>
  );
}
