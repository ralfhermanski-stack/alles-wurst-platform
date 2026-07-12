"use client";

import Link from "next/link";
import { useState } from "react";

import { primaryButtonClassName } from "@/components/tools/recipe-generator/recipe-form-classes";
import type { ForumRulesAcceptanceStatus } from "@/lib/legal/legal-acceptance-service";

type ForumRulesAcceptanceModalProps = {
  status: ForumRulesAcceptanceStatus;
  open: boolean;
  submitting?: boolean;
  onAccept: () => void | Promise<void>;
};

function reasonMessage(
  reason: ForumRulesAcceptanceStatus["reason"],
): string {
  switch (reason) {
    case "EXPIRED":
      return "Deine Zustimmung zu den Forenregeln ist abgelaufen. Bitte bestätige sie erneut, bevor du einen Beitrag verfasst.";
    case "DOCUMENT_UPDATED":
      return "Die Forenregeln wurden aktualisiert. Bitte lies die neue Fassung und bestätige sie.";
    case "MISSING":
    default:
      return "Bevor du im Forum schreibst, musst du die Forenregeln lesen und akzeptieren.";
  }
}

export default function ForumRulesAcceptanceModal({
  status,
  open,
  submitting = false,
  onAccept,
}: ForumRulesAcceptanceModalProps) {
  const [checked, setChecked] = useState(false);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="forum-rules-modal-title"
    >
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-aw-border bg-aw-surface shadow-xl">
        <div className="border-b border-aw-border px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-aw-gold">
            Forenregeln
          </p>
          <h2
            id="forum-rules-modal-title"
            className="mt-2 font-display text-xl font-bold text-aw-cream"
          >
            Zustimmung erforderlich
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-aw-muted">
            {reasonMessage(status.reason)}
          </p>
        </div>

        <div className="overflow-y-auto px-6 py-4 text-sm leading-relaxed text-aw-cream">
          <p>
            ALLES WURST lebt von einem freundlichen, respektvollen Austausch.
            Die Forenregeln gelten für alle Benutzergruppen und müssen alle drei
            Monate erneut bestätigt werden.
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-aw-muted">
            <li>Respektvoller Umgang — keine Beleidigungen oder Hassrede</li>
            <li>Freundlichkeit und Hilfsbereitschaft, besonders gegenüber Neulingen</li>
            <li>Ehrliche Beiträge auf Basis eigener Erfahrung</li>
            <li>Keine Werbung, Spam oder Urheberrechtsverletzungen</li>
            <li>Folge den Anweisungen der Moderation</li>
          </ul>
          <p className="mt-4">
            <Link
              href={status.rulesUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-aw-gold underline"
            >
              Vollständige Forenregeln lesen
            </Link>
          </p>
        </div>

        <div className="space-y-4 border-t border-aw-border px-6 py-5">
          <label className="flex items-start gap-3 text-sm text-aw-cream">
            <input
              type="checkbox"
              checked={checked}
              onChange={(event) => setChecked(event.target.checked)}
              className="mt-1 accent-aw-gold"
            />
            <span>{status.labelText}</span>
          </label>

          <button
            type="button"
            className={`${primaryButtonClassName} w-full`}
            disabled={!checked || submitting}
            onClick={() => void onAccept()}
          >
            {submitting ? "Wird gespeichert …" : "Forenregeln akzeptieren"}
          </button>
        </div>
      </div>
    </div>
  );
}
