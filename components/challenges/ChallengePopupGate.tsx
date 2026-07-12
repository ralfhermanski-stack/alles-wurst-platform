"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type PopupPayload = {
  challengeId: string;
  slug: string;
  title: string;
  excerpt: string | null;
};

export default function ChallengePopupGate() {
  const [popup, setPopup] = useState<PopupPayload | null>(null);

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/challenges/popup", { credentials: "include" });
      const json = (await response.json()) as {
        success: boolean;
        data?: PopupPayload | null;
      };

      if (json.success && json.data) {
        setPopup(json.data);
      }
    })();
  }, []);

  async function recordAction(action: "SEEN" | "REMIND_LATER" | "DISMISSED") {
    if (!popup) return;

    await fetch("/api/challenges/popup", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challengeId: popup.challengeId, action }),
    });

    setPopup(null);
  }

  if (!popup) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="challenge-popup-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-aw-border bg-aw-surface p-6 shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-aw-gold">
          Neue Challenge
        </p>
        <h2 id="challenge-popup-title" className="mt-2 font-display text-xl font-bold text-aw-cream">
          {popup.title}
        </h2>
        {popup.excerpt && (
          <p className="mt-2 text-sm text-aw-muted">{popup.excerpt}</p>
        )}
        <div className="mt-6 flex flex-col gap-2">
          <Link
            href={`/community/challenges/${popup.slug}/teilnehmen`}
            className="rounded-md bg-aw-gold px-4 py-2 text-center text-sm font-semibold text-aw-bg"
            onClick={() => void recordAction("SEEN")}
          >
            Jetzt teilnehmen
          </Link>
          <Link
            href={`/community/challenges/${popup.slug}`}
            className="rounded-md px-4 py-2 text-center text-sm font-semibold text-aw-cream ring-1 ring-aw-border"
            onClick={() => void recordAction("SEEN")}
          >
            Challenge ansehen
          </Link>
          <button
            type="button"
            className="text-sm text-aw-muted hover:text-aw-cream"
            onClick={() => void recordAction("REMIND_LATER")}
          >
            Später erinnern
          </button>
          <button
            type="button"
            className="text-sm text-aw-muted hover:text-aw-cream"
            onClick={() => void recordAction("DISMISSED")}
          >
            Nicht mehr anzeigen
          </button>
        </div>
      </div>
    </div>
  );
}
