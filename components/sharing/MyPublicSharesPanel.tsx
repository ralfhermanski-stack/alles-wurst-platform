"use client";

import { useCallback, useEffect, useState } from "react";

import {
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";
import type { ShareListItem } from "@/lib/sharing/share-types";

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Aktiv",
  DISABLED: "Deaktiviert",
  REVOKED: "Gelöscht",
  ADMIN_BLOCKED: "Gesperrt",
};

const TYPE_LABELS: Record<string, string> = {
  CERTIFICATE: "Zertifikat",
  DIPLOMA: "Urkunde",
  RECIPE: "Rezept",
};

export default function MyPublicSharesPanel() {
  const [shares, setShares] = useState<ShareListItem[]>([]);
  const [topShares, setTopShares] = useState<ShareListItem[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const [allRes, topRes] = await Promise.all([
      fetch("/api/shares", { credentials: "include" }),
      fetch("/api/shares?top=1", { credentials: "include" }),
    ]);

    const allJson = (await allRes.json()) as { success: boolean; data?: ShareListItem[] };
    const topJson = (await topRes.json()) as { success: boolean; data?: ShareListItem[] };

    if (allJson.success && allJson.data) setShares(allJson.data);
    if (topJson.success && topJson.data) setTopShares(topJson.data);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function updateShare(shareId: string, action: "update" | "revoke", status?: string) {
    setLoading(true);
    setMessage(null);

    const response = await fetch("/api/shares", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        action === "revoke"
          ? { action: "revoke", shareId }
          : { action: "update", shareId, status },
      ),
    });

    const json = (await response.json()) as { success: boolean; message?: string; error?: { message: string } };
    setLoading(false);
    setMessage(json.message ?? json.error?.message ?? "Aktualisiert.");
    if (json.success) await load();
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-display text-xl font-bold text-aw-cream">Deine beliebtesten Inhalte</h2>
        {topShares.length === 0 ? (
          <p className="mt-3 text-sm text-aw-muted">Noch keine Aufrufe auf geteilten Inhalten.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {topShares.map((share) => (
              <li key={share.id} className="rounded-xl border border-aw-border bg-aw-surface/40 p-4 text-sm">
                <p className="font-medium text-aw-cream">{share.title}</p>
                <p className="text-aw-muted">
                  {share.viewCount} Aufrufe · {share.totalShares} Shares
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-display text-xl font-bold text-aw-cream">Meine öffentlichen Freigaben</h2>
        <p className="mt-2 text-sm text-aw-muted">
          Du kannst Links deaktivieren, löschen oder wieder aktivieren. Gelöschte Freigaben liefern 404.
        </p>

        {message ? <p className="mt-4 text-sm text-aw-muted">{message}</p> : null}

        <ul className="mt-4 space-y-4">
          {shares.map((share) => (
            <li key={share.id} className="rounded-xl border border-aw-border bg-aw-surface/40 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-aw-muted">{TYPE_LABELS[share.contentType] ?? share.contentType}</p>
                  <h3 className="font-display text-lg font-bold text-aw-cream">{share.title}</h3>
                  <p className="mt-1 text-sm text-aw-muted">
                    {STATUS_LABELS[share.status] ?? share.status} · {share.viewCount} Aufrufe · erstellt{" "}
                    {new Date(share.createdAt).toLocaleDateString("de-DE")}
                  </p>
                  {share.status === "ACTIVE" ? (
                    <a href={share.shareUrl} className="mt-2 inline-block text-sm text-aw-gold hover:text-aw-cream">
                      {share.shareUrl}
                    </a>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {share.status === "ACTIVE" ? (
                    <button
                      type="button"
                      className={secondaryButtonClassName}
                      disabled={loading}
                      onClick={() => void updateShare(share.id, "update", "DISABLED")}
                    >
                      Deaktivieren
                    </button>
                  ) : share.status === "DISABLED" ? (
                    <button
                      type="button"
                      className={secondaryButtonClassName}
                      disabled={loading}
                      onClick={() => void updateShare(share.id, "update", "ACTIVE")}
                    >
                      Reaktivieren
                    </button>
                  ) : null}
                  {share.status !== "REVOKED" && share.status !== "ADMIN_BLOCKED" ? (
                    <button
                      type="button"
                      className={secondaryButtonClassName}
                      disabled={loading}
                      onClick={() => void updateShare(share.id, "revoke")}
                    >
                      Löschen
                    </button>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
          {shares.length === 0 ? (
            <li className="text-sm text-aw-muted">Noch keine Freigaben vorhanden.</li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
