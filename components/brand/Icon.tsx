type IconProps = {
  name: string;
  className?: string;
};

/**
 * Schlankes Icon-Set (Stroke-SVGs) für Karten und Kacheln.
 * Fällt bei unbekanntem Namen auf einen neutralen Punkt zurück.
 */
const paths: Record<string, React.ReactNode> = {
  salt: <path d="M8 3h8l1 5H7l1-5Zm-2 5h12l-1.2 13H7.2L6 8Zm4 4v5m4-5v5" />,
  brine: (
    <path d="M12 3s6 6.6 6 11a6 6 0 1 1-12 0c0-4.4 6-11 6-11Zm-3 11a3 3 0 0 0 3 3" />
  ),
  recipe: (
    <path d="M6 3h9l3 3v15H6V3Zm3 6h6M9 12h6M9 15h4" />
  ),
  marinade: (
    <path d="M9 3h6v3l3 3v12H6V9l3-3V3Zm-3 9h12" />
  ),
  analysis: <path d="M4 20V10m5 10V4m5 16v-7m5 7V8" />,
  shop: (
    <path d="M4 8h16l-1 12H5L4 8Zm4 0V6a4 4 0 0 1 8 0v2" />
  ),
  book: <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5V5.5Zm2.5 13H20" />,
  medal: (
    <path d="M8 3h8l-2 8H10L8 3Zm4 8a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 3v2l1.5 1" />
  ),
  chat: <path d="M4 5h16v11H8l-4 4V5Zm4 5h8M8 13h5" />,
  users: (
    <path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7 0a3 3 0 1 0 0-6M3 20v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1m2 0v-1a5 5 0 0 0-4-4.9" />
  ),
  spark: <path d="M12 3v6m0 6v6m9-9h-6M9 12H3m13.5-6.5-4 4m-3 3-4 4m11 0-4-4m-3-3-4-4" />,
  check: <path d="M5 13l4 4L19 7" />,
  crown: <path d="M4 8l3.5 6h9L20 8l-4.5 3L12 5l-3.5 6L4 8Zm3 9h10" />,
  coin: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M15 9.5a4 4 0 1 0 0 5M8.5 11h5m-5 2h5" />
    </>
  ),
  video: <path d="M4 7h11v10H4V7Zm11 3.2 5-3v9.6l-5-3" />,
  handshake: (
    <path d="m4 13 3-3 5 3 3-2 5 4M4 13v4h3m14-4v4h-3m-6-1 2 2m-4-4 2 2" />
  ),
  unlock: (
    <>
      <path d="M8 10V7a4 4 0 0 1 7.5-2" />
      <rect x="5" y="10" width="14" height="10" rx="1.5" />
      <path d="M12 14v3" />
    </>
  ),
  clock: <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 4v5l3.5 2" />,
  ticket: (
    <path d="M4 7h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4V7Zm10 0v10" />
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-4-4" />
    </>
  ),
  cap: (
    <path d="M12 4 2 9l10 5 10-5-10-5Zm-6 8v4c0 1.5 3 3 6 3s6-1.5 6-3v-4" />
  ),
  flag: <path d="M6 3v18M6 4h11l-2 4 2 4H6" />,
  sausage: (
    <path d="M5 4c0 9 6 15 15 15 1.1 0 2-.9 2-2s-.9-2-2-2C12.7 15 9 11.3 9 4c0-1.1-.9-2-2-2S5 2.9 5 4Zm1.2 1.6L4 3.4m14.4 16.2 2.2 2.2" />
  ),
  flame: (
    <path d="M12 3c.7 3.5 3 4.8 3.8 7.4.9 2.9-.9 5.6-3.8 5.6s-4.7-2.4-3.8-5.3c.4-1.2 1.2-1.7 1.8-1.4.5.3.2 1.5.7 1.9.8.6 1.6-.2 1.4-1.4C9.8 8 10.7 5.4 12 3Zm0 18v0" />
  ),
  leaf: (
    <path d="M4 20C4 11 10 5 20 5c0 10-6 15-15 15H4Zm4-3c3.5-4.5 6.5-6.8 10-8" />
  ),
  knife: (
    <path d="M3 21 14 10m0 0 4-6c1.6-2.4 3.6-1.6 3.6 1.1 0 3.4-2.4 6.3-5 7.9L14 10Zm-4 8 2-2" />
  ),
  grill: (
    <>
      <path d="M3.5 9h17a8.5 8.5 0 0 1-17 0Z" />
      <path d="M7 17.5 5.5 21m11-3.5L18 21M9.5 5.5c0-1.3 1.3-1.3 1.3 0m2.4 0c0-1.3 1.3-1.3 1.3 0" />
    </>
  ),
  smoke: (
    <path d="M8 21c-2-2 .5-3.6.5-5.6S6 11.6 8 9.1 10.5 5.5 9 2.6m6.5 18.4c-2-2 .5-3.6.5-5.6s-2.5-3.8-.5-6.3 2.5-3.6 1-6.5" />
  ),
  meat: (
    <>
      <path d="M7 5.5C12 3 19 5 19 11c0 5-5 8-9 8-3.5 0-6.5-2.5-6.5-6 0-2 1-3.5 2.3-4.4" />
      <circle cx="8.6" cy="12.6" r="1.4" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="9.5" rx="1.8" />
      <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5M12 14.5v2" />
    </>
  ),
  help: (
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.5a2.5 2.5 0 0 1 4.5 1.5c0 2-2.5 2.5-2.5 4" />
    <circle cx="12" cy="17.5" r="0.5" fill="currentColor" stroke="none" />
  </>
  ),
  tiktok: (
    <path d="M9 6v9.5a3.5 3.5 0 1 0 3.5-3.5V4h3.5" />
  ),
  instagram: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <circle cx="12" cy="12" r="3.5" />
      <circle cx="17" cy="7" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  facebook: (
    <path d="M14 8h2.5V4.5H14c-2.5 0-4 1.5-4 4v2H7v3.5h3V20h4v-8.5h3.5L18 8h-4Z" />
  ),
  youtube: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="3" />
      <path d="M11 10v4l4-2-4-2Z" fill="currentColor" stroke="none" />
    </>
  ),
};

export default function Icon({ name, className = "h-6 w-6" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[name] ?? <circle cx="12" cy="12" r="3" />}
    </svg>
  );
}
