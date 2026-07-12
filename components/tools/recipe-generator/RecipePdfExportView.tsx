"use client";

/**
 * @file RecipePdfExportView.tsx
 * @purpose Lädt ein gespeichertes Rezept und zeigt die Druckansicht für den PDF-Export.
 */

import { useEffect, useState } from "react";

import RecipePrintDocument from "@/components/tools/recipe-generator/RecipePrintDocument";
import { secondaryButtonClassName } from "@/components/tools/recipe-generator/recipe-form-classes";
import { fetchRecipe } from "@/lib/tools/recipe-client";
import {
  prepareRecipePdfData,
  type RecipePdfData,
} from "@/lib/tools/recipe-pdf-data";
import {
  DEFAULT_RECIPE_PDF_SETTINGS,
  fetchRecipePdfSettings,
  type RecipePdfSettings,
} from "@/lib/tools/recipe-pdf-settings";
import { getRecipeUserId } from "@/lib/tools/recipe-session";

type RecipePdfExportViewProps = {
  recipeId: string;
  autoPrint?: boolean;
};

/**
 * Exportseite: lädt Rezeptdaten, rendert Druckdokument, öffnet optional den Druckdialog.
 */
export default function RecipePdfExportView({
  recipeId,
  autoPrint = false,
}: RecipePdfExportViewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfData, setPdfData] = useState<RecipePdfData | null>(null);
  const [pdfSettings, setPdfSettings] = useState<RecipePdfSettings>(
    DEFAULT_RECIPE_PDF_SETTINGS,
  );
  const [printTriggered, setPrintTriggered] = useState(false);

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

      const prepared = prepareRecipePdfData(response.data);

      if (!prepared.success) {
        setError(prepared.error);
        setPdfData(null);
      } else {
        setPdfData(prepared.data);
      }

      setLoading(false);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [recipeId]);

  useEffect(() => {
    if (!autoPrint || loading || error || !pdfData || printTriggered) {
      return;
    }

    const timer = window.setTimeout(() => {
      window.print();
      setPrintTriggered(true);
    }, 400);

    return () => {
      window.clearTimeout(timer);
    };
  }, [autoPrint, loading, error, pdfData, printTriggered]);

  return (
    <div className="min-h-screen bg-aw-bg print:bg-white">
      <div className="print:hidden sticky top-0 z-10 border-b border-aw-border bg-aw-surface/95 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[210mm] flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-aw-muted">
            Druckvorschau — wähle im Dialog „Als PDF speichern“.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={secondaryButtonClassName}
              disabled={!pdfData}
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

        {pdfData && (
          <RecipePrintDocument data={pdfData} pdfSettings={pdfSettings} />
        )}
      </div>
    </div>
  );
}
