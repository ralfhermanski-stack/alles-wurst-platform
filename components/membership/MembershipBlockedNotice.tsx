"use client";

/**
 * @file MembershipBlockedNotice.tsx
 * @purpose Deutsche Sperrhinweise bei fehlender Mitgliedschaftsberechtigung.
 */

type MembershipBlockedNoticeProps = {
  message: string;
  title?: string;
};

/**
 * Hervorgehobener Hinweis bei gesperrtem Zugriff.
 */
export default function MembershipBlockedNotice({
  message,
  title = "Zugriff eingeschränkt",
}: MembershipBlockedNoticeProps) {
  return (
    <div
      className="rounded-xl border border-aw-warning/40 bg-aw-warning/10 px-5 py-4"
      role="alert"
    >
      <p className="text-sm font-semibold text-aw-warning">{title}</p>
      <p className="mt-2 text-sm leading-6 text-aw-cream/90">{message}</p>
    </div>
  );
}
