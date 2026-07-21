"use client";

/**
 * @file RecipePdfExportButton.tsx
 * @purpose Öffnet die Druckansicht für den PDF-Export eines gespeicherten Rezepts.
 */

import { useState } from "react";

import RecipePdfExportDialog from "@/components/tools/recipe-generator/RecipePdfExportDialog";
import { secondaryButtonClassName } from "@/components/tools/recipe-generator/recipe-form-classes";

type RecipePdfExportButtonProps = {
  recipeId: string;
  className?: string;
  disabled?: boolean;
  /** Speichert aktuelle Wizard-Daten vor dem Export (inkl. Därme). */
  onBeforeExport?: () => Promise<boolean>;
};

/**
 * Startet den PDF-Export über die druckoptimierte Exportseite.
 */
export default function RecipePdfExportButton({
  recipeId,
  className,
  disabled = false,
  onBeforeExport,
}: RecipePdfExportButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buttonClassName = className ?? secondaryButtonClassName;

  async function handleOpen() {
    setError(null);

    if (onBeforeExport) {
      setPreparing(true);
      const ok = await onBeforeExport();
      setPreparing(false);

      if (!ok) {
        setError(
          "Bitte speichere das Rezept zuerst — sonst fehlen aktuelle Angaben (z. B. Därme) im PDF.",
        );
        return;
      }
    }

    setDialogOpen(true);
  }

  return (
    <>
      <div className="inline-flex flex-col items-start gap-2">
        <button
          type="button"
          className={buttonClassName}
          disabled={disabled || !recipeId || preparing}
          onClick={() => {
            void handleOpen();
          }}
        >
          {preparing ? "Wird gespeichert …" : "PDF exportieren"}
        </button>
        {error && (
          <p className="text-xs text-aw-warning" role="alert">
            {error}
          </p>
        )}
      </div>

      <RecipePdfExportDialog
        open={dialogOpen}
        recipeId={recipeId}
        onClose={() => setDialogOpen(false)}
      />
    </>
  );
}
