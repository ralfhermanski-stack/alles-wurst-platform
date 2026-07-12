"use client";

import { useCallback, useEffect, useState } from "react";

import {
  inputClassName,
  labelClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

type ShareTarget = "whatsapp" | "facebook" | "linkedin" | "twitter" | "email" | "copy" | "instagram";

type Props = {
  open: boolean;
  onClose: () => void;
  mode: "certificate" | "diploma" | "recipe";
  certificateId?: string;
  recipeId?: string;
  title: string;
  existingShareUrl?: string | null;
};

const TARGET_LABELS: Record<ShareTarget, string> = {
  whatsapp: "WhatsApp",
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  twitter: "X (Twitter)",
  email: "E-Mail",
  copy: "Link kopieren",
};

export default function ShareModal({
  open,
  onClose,
  mode,
  certificateId,
  recipeId,
  title,
  existingShareUrl,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(existingShareUrl ?? null);
  const [consentOpen, setConsentOpen] = useState(false);
  const [recipeIsPublic, setRecipeIsPublic] = useState(true);
  const [recipeLinkOnly, setRecipeLinkOnly] = useState(false);
  const [showIngredients, setShowIngredients] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    setShareUrl(existingShareUrl ?? null);
  }, [existingShareUrl, open]);

  const trackEvent = useCallback(async (shareToken: string, event: string) => {
    const token = shareToken.split("/").pop();
    if (!token) return;
    await fetch(`/api/shares/${token}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event }),
    });
  }, []);

  async function ensureShare(consent = false): Promise<string | null> {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/shares", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "recipe"
            ? {
                action: "recipe",
                recipeId,
                isPublic: recipeIsPublic,
                linkOnly: recipeLinkOnly,
                showIngredients,
                showInstructions,
              }
            : {
                action: "certificate",
                certificateId,
                consent,
              },
        ),
      });

      const json = (await response.json()) as {
        success: boolean;
        data?: { shareUrl: string; shareToken: string };
        error?: { message: string };
      };

      if (!response.ok || !json.success || !json.data?.shareUrl) {
        throw new Error(json.error?.message ?? "Freigabe konnte nicht erstellt werden.");
      }

      setShareUrl(json.data.shareUrl);
      return json.data.shareUrl;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Freigabe fehlgeschlagen.");
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function handleShare(target: ShareTarget) {
    if ((mode === "certificate" || mode === "diploma") && !shareUrl && !consentOpen) {
      setConsentOpen(true);
      return;
    }

    let url = shareUrl;

    if (!url) {
      url = await ensureShare(mode !== "recipe");
      if (!url) return;
    }

    const encodedUrl = encodeURIComponent(url);
    const encodedText = encodeURIComponent(`${title} — ALLES WURST`);

    if (target === "copy" || target === "instagram") {
      await navigator.clipboard.writeText(url);
      setMessage(
        target === "instagram"
          ? "Link kopiert — in Instagram als Link in der Bio oder Story einfügen."
          : "Link kopiert.",
      );
      void trackEvent(url, "link_copy");
      return;
    }

    const links: Record<Exclude<ShareTarget, "copy" | "instagram">, string> = {
      whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
      email: `mailto:?subject=${encodedText}&body=${encodedUrl}`,
    };

    void trackEvent(url, target === "twitter" ? "twitter" : target);
    window.open(links[target], "_blank", "noopener,noreferrer");
  }

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <div className="w-full max-w-lg rounded-2xl border border-aw-border bg-aw-surface p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold text-aw-cream">
              {mode === "recipe" ? "Rezept teilen" : mode === "diploma" ? "Urkunde teilen" : "Zertifikat teilen"}
            </h2>
            <p className="mt-1 text-sm text-aw-muted">{title}</p>
          </div>
          <button type="button" className="text-aw-muted hover:text-aw-cream" onClick={onClose}>
            ✕
          </button>
        </div>

        {consentOpen && !shareUrl ? (
          <div className="mt-5 rounded-xl border border-aw-gold/30 bg-aw-gold/5 p-4">
            <p className="text-sm text-aw-cream">Öffentliche Seite erstellen?</p>
            <p className="mt-2 text-sm text-aw-muted">
              Nur mit deiner Zustimmung wird eine öffentliche URL erzeugt. Du kannst die Freigabe jederzeit
              widerrufen.
            </p>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                className={primaryButtonClassName}
                disabled={loading}
                onClick={() => void ensureShare(true).then((url) => url && setConsentOpen(false))}
              >
                Ja, öffentlich teilen
              </button>
              <button type="button" className={secondaryButtonClassName} onClick={() => setConsentOpen(false)}>
                Nein
              </button>
            </div>
          </div>
        ) : null}

        {mode === "recipe" ? (
          <div className="mt-5 space-y-3 text-sm text-aw-cream">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={recipeIsPublic}
                onChange={(e) => setRecipeIsPublic(e.target.checked)}
              />
              Rezept öffentlich teilen
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={recipeLinkOnly}
                onChange={(e) => setRecipeLinkOnly(e.target.checked)}
              />
              Nur Linkbesitzer dürfen sehen
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showIngredients}
                onChange={(e) => setShowIngredients(e.target.checked)}
              />
              Zutatenliste anzeigen
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showInstructions}
                onChange={(e) => setShowInstructions(e.target.checked)}
              />
              Herstellung anzeigen
            </label>
            {!shareUrl && (
              <button
                type="button"
                className={primaryButtonClassName}
                disabled={loading}
                onClick={() => void ensureShare()}
              >
                Freigabe erstellen
              </button>
            )}
          </div>
        ) : null}

        {shareUrl ? (
          <label className="mt-5 block">
            <span className={labelClassName}>Öffentlicher Link</span>
            <input className={inputClassName} readOnly value={shareUrl} />
          </label>
        ) : null}

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {(Object.keys(TARGET_LABELS) as ShareTarget[]).map((target) => (
            <button
              key={target}
              type="button"
              className={secondaryButtonClassName}
              disabled={loading || (mode === "recipe" && !shareUrl && target !== "copy")}
              onClick={() => void handleShare(target)}
            >
              {TARGET_LABELS[target]}
            </button>
          ))}
        </div>

        {message && <p className="mt-4 text-sm text-aw-muted">{message}</p>}
      </div>
    </div>
  );
}

export function ShareButton({
  label,
  mode,
  certificateId,
  recipeId,
  title,
}: {
  label: string;
  mode: "certificate" | "diploma" | "recipe";
  certificateId?: string;
  recipeId?: string;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const params = new URLSearchParams();
      if (certificateId) params.set("certificateId", certificateId);
      if (recipeId) params.set("recipeId", recipeId);

      const response = await fetch(`/api/shares/can-share?${params.toString()}`, {
        credentials: "include",
      });
      const json = (await response.json()) as {
        success: boolean;
        data?: { allowed: boolean };
      };

      if (!cancelled && json.success) {
        setAllowed(json.data?.allowed ?? false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [certificateId, recipeId]);

  if (allowed === false) {
    return null;
  }

  return (
    <>
      <button type="button" className={secondaryButtonClassName} onClick={() => setOpen(true)}>
        {label}
      </button>
      <ShareModal
        open={open}
        onClose={() => setOpen(false)}
        mode={mode}
        certificateId={certificateId}
        recipeId={recipeId}
        title={title}
        existingShareUrl={shareUrl}
      />
    </>
  );
}
