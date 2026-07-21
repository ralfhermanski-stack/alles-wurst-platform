"use client";

/**
 * @file RecipePdfExportView.tsx
 * @purpose Lädt ein gespeichertes Rezept und zeigt die Druckansicht für den PDF-Export.
 */

import { useEffect, useMemo, useState } from "react";

import RecipePrintDocument from "@/components/tools/recipe-generator/RecipePrintDocument";
import {
  labelClassName,
  secondaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";
import { fetchSessionApi } from "@/lib/auth/auth-client";
import { fetchRecipe } from "@/lib/tools/recipe-client";
import {
  prepareRecipePdfData,
  type RecipePdfData,
} from "@/lib/tools/recipe-pdf-data";
import {
  RECIPE_PDF_AUTHOR_DISPLAY_LABELS,
  buildRecipePdfAuthorPreview,
  resolveRecipePdfAuthorName,
  type RecipePdfAuthorDisplay,
} from "@/lib/tools/recipe-pdf-author";
import {
  DEFAULT_RECIPE_PDF_SETTINGS,
  fetchRecipePdfSettings,
  type RecipePdfSettings,
} from "@/lib/tools/recipe-pdf-settings";
import { getRecipeUserId } from "@/lib/tools/recipe-session";

const STORAGE_KEY = "recipe-pdf-author-display";

type RecipePdfExportViewProps = {
  recipeId: string;
  autoPrint?: boolean;
  authorDisplay?: RecipePdfAuthorDisplay | null;
};

/**
 * Exportseite: lädt Rezeptdaten, rendert Druckdokument, öffnet optional den Druckdialog.
 */
export default function RecipePdfExportView({
  recipeId,
  autoPrint = false,
  authorDisplay: initialAuthorDisplay = null,
}: RecipePdfExportViewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfData, setPdfData] = useState<RecipePdfData | null>(null);
  const [pdfSettings, setPdfSettings] = useState<RecipePdfSettings>(
    DEFAULT_RECIPE_PDF_SETTINGS,
  );
  const [printTriggered, setPrintTriggered] = useState(false);
  const [authorDisplay, setAuthorDisplay] = useState<RecipePdfAuthorDisplay | null>(
    initialAuthorDisplay,
  );
  const [authorPreview, setAuthorPreview] = useState<
    Record<RecipePdfAuthorDisplay, string> | null
  >(null);
  const [authorReady, setAuthorReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadAuthor() {
      if (initialAuthorDisplay) {
        setAuthorDisplay(initialAuthorDisplay);
        setAuthorReady(true);
        return;
      }

      const savedDisplay = localStorage.getItem(STORAGE_KEY);
      if (
        savedDisplay === "publicName" ||
        savedDisplay === "firstName" ||
        savedDisplay === "fullName"
      ) {
        setAuthorDisplay(savedDisplay);
        setAuthorReady(true);
        return;
      }

      const session = await fetchSessionApi();

      if (cancelled) {
        return;
      }

      if (!session.success || !session.data?.profile) {
        setAuthorReady(true);
        return;
      }

      const profile = {
        publicName: session.data.profile.publicName,
        firstName: session.data.profile.firstName,
        lastName: session.data.profile.lastName,
      };

      setAuthorPreview(buildRecipePdfAuthorPreview(profile));
      setAuthorReady(true);
    }

    void loadAuthor();

    return () => {
      cancelled = true;
    };
  }, [initialAuthorDisplay]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const [response, settings] = await Promise.all([
        fetchRecipe(recipeId, getRecipeUserId()),
        fetchRecipePdfSettings(),
      ]);

      if (cancelled) {
        return;
      }

      setPdfSettings(settings);

      if (!response.success) {
        setError(response.error.message);
        setPdfData(null);
        setLoading(false);
        return;
      }

      setLoading(false);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [recipeId]);

  useEffect(() => {
    if (!authorReady || loading) {
      return;
    }

    let cancelled = false;

    async function buildPdfData() {
      const response = await fetchRecipe(recipeId, getRecipeUserId());

      if (cancelled || !response.success) {
        return;
      }

      let authorName: string | null = null;

      if (authorDisplay) {
        const session = await fetchSessionApi();

        if (session.success && session.data?.profile) {
          authorName = resolveRecipePdfAuthorName(
            {
              publicName: session.data.profile.publicName,
              firstName: session.data.profile.firstName,
              lastName: session.data.profile.lastName,
            },
            authorDisplay,
          );
        }
      }

      const prepared = prepareRecipePdfData(response.data, { authorName });

      if (!prepared.success) {
        setError(prepared.error);
        setPdfData(null);
        return;
      }

      setPdfData(prepared.data);
    }

    void buildPdfData();

    return () => {
      cancelled = true;
    };
  }, [authorReady, authorDisplay, loading, recipeId]);

  const authorOptions = useMemo(
    () =>
      (["publicName", "firstName", "fullName"] as RecipePdfAuthorDisplay[]).map(
        (value) => ({
          value,
          label: RECIPE_PDF_AUTHOR_DISPLAY_LABELS[value],
          preview: authorPreview?.[value] ?? "…",
        }),
      ),
    [authorPreview],
  );

  useEffect(() => {
    if (
      !autoPrint ||
      loading ||
      error ||
      !pdfData ||
      printTriggered ||
      !authorDisplay
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      window.print();
      setPrintTriggered(true);
    }, 400);

    return () => {
      window.clearTimeout(timer);
    };
  }, [autoPrint, loading, error, pdfData, printTriggered, authorDisplay]);

  function applyAuthorDisplay(display: RecipePdfAuthorDisplay) {
    localStorage.setItem(STORAGE_KEY, display);
    setAuthorDisplay(display);
  }

  const needsAuthorChoice = authorReady && !authorDisplay && !loading && !error;

  return (
    <div className="min-h-screen bg-aw-bg print:bg-white">
      <div className="print:hidden sticky top-0 z-10 border-b border-aw-border bg-aw-surface/95 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto max-w-[210mm] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-aw-muted">
              Druckvorschau — wähle im Dialog „Als PDF speichern“.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={secondaryButtonClassName}
                disabled={!pdfData || !authorDisplay}
                onClick={() => window.print()}
              >
                Als PDF speichern
              </button>
              <button
                type="button"
                className={secondaryButtonClassName}
                onClick={() => window.close()}
              >
                Schließen
              </button>
            </div>
          </div>

          {needsAuthorChoice && (
            <fieldset className="rounded-xl border border-aw-border bg-aw-bg/60 p-4">
              <legend className={labelClassName}>
                Wie soll dein Name als Ersteller erscheinen?
              </legend>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {authorOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className="rounded-lg border border-aw-border bg-aw-surface px-3 py-3 text-left text-sm transition-colors hover:border-aw-gold/50"
                    onClick={() => applyAuthorDisplay(option.value)}
                  >
                    <span className="block font-semibold text-aw-cream">
                      {option.label}
                    </span>
                    <span className="mt-1 block text-aw-muted">
                      {option.preview}
                    </span>
                  </button>
                ))}
              </div>
            </fieldset>
          )}
        </div>
      </div>

      <div className="px-4 py-8 print:p-0">
        {loading && (
          <p className="text-center text-sm text-aw-muted">
            Rezept wird für den Export geladen …
          </p>
        )}

        {error && (
          <div
            className="mx-auto max-w-lg rounded-xl border border-aw-warning/40 bg-aw-warning/10 px-5 py-4 text-sm text-aw-warning"
            role="alert"
          >
            {error}
          </div>
        )}

        {pdfData && authorDisplay && (
          <RecipePrintDocument data={pdfData} pdfSettings={pdfSettings} />
        )}

        {needsAuthorChoice && (
          <p className="mt-6 text-center text-sm text-aw-muted print:hidden">
            Bitte wähle oben eine Anzeige für den Ersteller, bevor du das PDF
            speicherst.
          </p>
        )}
      </div>
    </div>
  );
}
