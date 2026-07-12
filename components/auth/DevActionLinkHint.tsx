/**
 * @file DevActionLinkHint.tsx
 * @purpose Zeigt im Entwicklungsmodus einen direkten Aktionslink an.
 */

type DevActionLinkHintProps = {
  link: string;
  label?: string;
};

export default function DevActionLinkHint({
  link,
  label = "Entwicklungsmodus — direkter Link:",
}: DevActionLinkHintProps) {
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <div className="rounded-lg border border-aw-gold/30 bg-aw-gold/10 px-4 py-3 text-sm text-aw-cream">
      <p className="font-semibold text-aw-gold">{label}</p>
      <a
        href={link}
        className="mt-2 block break-all font-mono text-xs text-aw-cream underline hover:text-aw-gold"
      >
        {link}
      </a>
    </div>
  );
}
