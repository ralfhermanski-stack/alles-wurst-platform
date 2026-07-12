import Link from "next/link";

import {
  secondaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

export const metadata = {
  title: "Challenge-Einstellungen",
};

export default function AdminChallengeSettingsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-aw-cream">
          Challenge-Einstellungen
        </h1>
        <p className="mt-1 text-sm text-aw-muted">
          Globale Einstellungen für Community-Challenges (Platzhalter).
        </p>
      </div>

      <section className="rounded-xl border border-aw-border bg-aw-surface/40 p-5">
        <p className="text-sm text-aw-muted">
          Erweiterte Optionen wie Standard-Abstimmungsmodus, Popup-Vorlagen und
          E-Mail-Benachrichtigungen werden hier in einer späteren Version ergänzt.
        </p>
      </section>

      <Link href="/admin/community/challenges" className={secondaryButtonClassName}>
        Zur Challenge-Übersicht
      </Link>
    </div>
  );
}
