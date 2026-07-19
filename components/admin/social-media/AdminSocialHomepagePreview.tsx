"use client";

import { useEffect, useState } from "react";

import SocialPlatformCardView from "@/components/cards/SocialPlatformCardView";
import PlatformTextFallback from "@/components/platform-text/PlatformTextFallback";
import { getPlatformTextDefault } from "@/lib/platform-text/platform-text-defaults";
import { adminFetch } from "@/lib/admin/admin-fetch";
import type { HomepageSocialCard } from "@/lib/social-media/social-media-types";

type PreviewMode = "desktop" | "tablet" | "mobile";

function previewLayoutClass(mode: PreviewMode, count: number): string {
  if (count <= 1) {
    return mode === "mobile" ? "max-w-sm" : "max-w-3xl";
  }
  if (mode === "mobile") {
    return "grid max-w-sm grid-cols-1 gap-6";
  }
  if (count === 2) {
    return "grid max-w-3xl gap-6 sm:grid-cols-2";
  }
  if (count === 3) {
    return mode === "tablet"
      ? "grid max-w-3xl gap-6 sm:grid-cols-2"
      : "grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3";
  }
  if (mode === "tablet") {
    return "grid max-w-3xl gap-6 sm:grid-cols-2";
  }
  return "grid max-w-6xl gap-6 sm:grid-cols-2 xl:grid-cols-4";
}

export default function AdminSocialHomepagePreview() {
  const [cards, setCards] = useState<HomepageSocialCard[]>([]);
  const [mode, setMode] = useState<PreviewMode>("desktop");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const response = await adminFetch<HomepageSocialCard[]>(
        "/api/admin/social-media/homepage-preview",
      );

      if (!response.success) {
        setError(response.error.message);
        setLoading(false);
        return;
      }

      setCards(response.data);
      setLoading(false);
    })();
  }, []);

  const followerLabel =
    getPlatformTextDefault("homepage.social.follow")?.defaultValue ?? "Abonnenten";

  return (
    <section className="rounded-xl border border-aw-border bg-aw-surface/40 p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-bold text-aw-cream">
            <PlatformTextFallback
              textKey="admin.social.setup.preview"
              as="span"
              fallback="Startseiten-Vorschau"
            />
          </h2>
          <p className="mt-1 text-sm text-aw-muted">
            So erscheinen die Kanäle aktuell auf der Startseite.
          </p>
        </div>
        <div className="flex gap-2">
          {(["desktop", "tablet", "mobile"] as PreviewMode[]).map((entry) => (
            <button
              key={entry}
              type="button"
              onClick={() => setMode(entry)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                mode === entry
                  ? "bg-aw-gold text-aw-bg"
                  : "border border-aw-border text-aw-muted"
              }`}
            >
              {entry === "desktop"
                ? "Desktop"
                : entry === "tablet"
                  ? "Tablet"
                  : "Mobil"}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-aw-warning">{error}</p>}
      {loading && <p className="mt-4 text-sm text-aw-muted">Vorschau wird geladen …</p>}

      <div className="mx-auto mt-6">
        {cards.length === 0 ? (
          <p className="text-center text-sm text-aw-muted">
            Keine Kanäle für die Startseiten-Anzeige aktiv.
          </p>
        ) : (
          <div className={`mx-auto ${previewLayoutClass(mode, cards.length)}`}>
            {cards.map((card) => (
              <SocialPlatformCardView
                key={card.id}
                platform={card}
                followerLabel={followerLabel}
                variant={cards.length === 1 ? "spotlight" : "card"}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
