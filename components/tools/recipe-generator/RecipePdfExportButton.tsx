"use client";

/**
 * @file RecipePdfExportButton.tsx
 * @purpose Öffnet die Druckansicht für den PDF-Export eines gespeicherten Rezepts.
 */

import { useState } from "react";

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
  const [error, setError] = useState<string | null>(null);

  function handleExport() {
    setError(null);

    const url = `/werkstatt/rezeptgenerator/${recipeId}/export?auto=1`;
    const popup = window.open(url, "_blank", "noopener,noreferrer");

    if (!popup) {
      setError(
        "Pop-up blockiert — bitte Pop-ups erlauben oder die Exportseite manuell öffnen.",
      );
    }
  }

  const buttonClassName = className ?? secondaryButtonClassName;

  return (
    <div className="inline-flex flex-col items-start gap-2">
      <button
        type="button"
        className={buttonClassName}
        disabled={disabled || !recipeId}
        onClick={handleExport}
      >
        PDF exportieren
      </button>
      {error && (
        <p className="text-xs text-aw-warning" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
