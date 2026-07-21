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
};

/**
 * Startet den PDF-Export über die druckoptimierte Exportseite.
 */
export default function RecipePdfExportButton({
  recipeId,
  className,
  disabled = false,
}: RecipePdfExportButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buttonClassName = className ?? secondaryButtonClassName;

  return (
    <>
      <div className="inline-flex flex-col items-start gap-2">
        <button
          type="button"
          className={buttonClassName}
          disabled={disabled || !recipeId}
          onClick={() => {
            setError(null);
            setDialogOpen(true);
          }}
        >
          PDF exportieren
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
