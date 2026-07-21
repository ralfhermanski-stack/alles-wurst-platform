"use client";

import { useEffect, useMemo, useState } from "react";

import { fetchSessionApi } from "@/lib/auth/auth-client";
import {
  labelClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  sectionCardClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";
import {
  RECIPE_PDF_AUTHOR_DISPLAY_LABELS,
  buildRecipePdfAuthorPreview,
  type RecipePdfAuthorDisplay,
} from "@/lib/tools/recipe-pdf-author";

const STORAGE_KEY = "recipe-pdf-author-display";

type RecipePdfExportDialogProps = {
  open: boolean;
  recipeId: string;
  onClose: () => void;
};

/**
 * Fragt vor dem PDF-Export, wie der Erstellername aus dem Profil angezeigt werden soll.
 */
export default function RecipePdfExportDialog({
  open,
  recipeId,
  onClose,
}: RecipePdfExportDialogProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [display, setDisplay] = useState<RecipePdfAuthorDisplay>("publicName");
  const [preview, setPreview] = useState<
    Record<RecipePdfAuthorDisplay, string> | null
  >(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    async function loadProfile() {
      setLoading(true);
      setError(null);

      const savedDisplay = localStorage.getItem(STORAGE_KEY);
      if (
        savedDisplay === "publicName" ||
        savedDisplay === "firstName" ||
        savedDisplay === "fullName"
      ) {
        setDisplay(savedDisplay);
      }

      const response = await fetchSessionApi();

      if (cancelled) {
        return;
      }

      if (!response.success || !response.data?.profile) {
        setError(
          response.success
            ? "Profil nicht gefunden — bitte Profil vervollständigen."
            : response.error.message,
        );
        setPreview(null);
        setLoading(false);
        return;
      }

      const profile = {
        publicName: response.data.profile.publicName,
        firstName: response.data.profile.firstName,
        lastName: response.data.profile.lastName,
      };

      setPreview(buildRecipePdfAuthorPreview(profile));
      setLoading(false);
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [open]);

  const options = useMemo(
    () =>
      (["publicName", "firstName", "fullName"] as RecipePdfAuthorDisplay[]).map(
        (value) => ({
          value,
          label: RECIPE_PDF_AUTHOR_DISPLAY_LABELS[value],
          preview: preview?.[value] ?? "…",
        }),
      ),
    [preview],
  );

  function handleExport() {
    localStorage.setItem(STORAGE_KEY, display);

    const params = new URLSearchParams({
      auto: "1",
      author: display,
    });
    const url = `/werkstatt/rezeptgenerator/${recipeId}/export?${params.toString()}`;
    const popup = window.open(url, "_blank", "noopener,noreferrer");

    if (!popup) {
      setError(
        "Pop-up blockiert — bitte Pop-ups erlauben oder die Exportseite manuell öffnen.",
      );
      return;
    }

    onClose();
  }

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="recipe-pdf-export-title"
    >
      <div className={`w-full max-w-lg ${sectionCardClassName}`}>
        <h2
          id="recipe-pdf-export-title"
          className="font-display text-xl font-bold text-aw-cream"
        >
          PDF exportieren
        </h2>
        <p className="mt-2 text-sm text-aw-muted">
          Wie soll dein Name als Ersteller auf dem Rezept erscheinen?
        </p>

        {loading && (
          <p className="mt-4 text-sm text-aw-muted">Profil wird geladen …</p>
        )}

        {error && (
          <p className="mt-4 text-sm text-aw-warning" role="alert">
            {error}
          </p>
        )}

        {!loading && !error && (
          <fieldset className="mt-5 space-y-3">
            <legend className={labelClassName}>Anzeige im PDF</legend>
            {options.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-aw-border bg-aw-bg/60 px-4 py-3 transition-colors hover:border-aw-gold/40"
              >
                <input
                  type="radio"
                  name="authorDisplay"
                  value={option.value}
                  checked={display === option.value}
                  onChange={() => setDisplay(option.value)}
                  className="mt-1"
                />
                <span>
                  <span className="block text-sm font-semibold text-aw-cream">
                    {option.label}
                  </span>
                  <span className="mt-1 block text-sm text-aw-muted">
                    Vorschau: {option.preview}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>
        )}

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            className={secondaryButtonClassName}
            onClick={onClose}
          >
            Abbrechen
          </button>
          <button
            type="button"
            className={primaryButtonClassName}
            disabled={loading || Boolean(error)}
            onClick={handleExport}
          >
            PDF erstellen
          </button>
        </div>
      </div>
    </div>
  );
}
