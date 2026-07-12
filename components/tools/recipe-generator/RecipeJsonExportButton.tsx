"use client";

/**
 * @file RecipeJsonExportButton.tsx
 * @purpose Exportiert ein gespeichertes Rezept als JSON-Datei.
 */

import { useState } from "react";

import { secondaryButtonClassName } from "@/components/tools/recipe-generator/recipe-form-classes";
import { fetchRecipe, type ApiRecipe } from "@/lib/tools/recipe-client";
import {
  buildRecipeExportFile,
  downloadRecipeExportFile,
} from "@/lib/tools/recipe-import-export";
import { getRecipeUserId } from "@/lib/tools/recipe-session";

type RecipeJsonExportButtonProps = {
  recipeId: string;
  recipe?: ApiRecipe;
  className?: string;
  disabled?: boolean;
};

/**
 * Lädt bei Bedarf das Rezept und startet den JSON-Download.
 */
export default function RecipeJsonExportButton({
  recipeId,
  recipe,
  className,
  disabled = false,
}: RecipeJsonExportButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setError(null);
    setLoading(true);

    try {
      let exportRecipe = recipe;

      if (!exportRecipe) {
        const response = await fetchRecipe(recipeId, getRecipeUserId());

        if (!response.success) {
          setError(response.error.message);
          return;
        }

        exportRecipe = response.data;
      }

      const exportFile = buildRecipeExportFile(exportRecipe);
      downloadRecipeExportFile(exportFile);
    } catch {
      setError("Der Export ist fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setLoading(false);
    }
  }

  const buttonClassName = className ?? secondaryButtonClassName;

  return (
    <div className="inline-flex flex-col items-start gap-2">
      <button
        type="button"
        className={buttonClassName}
        disabled={disabled || !recipeId || loading}
        onClick={() => void handleExport()}
      >
        {loading ? "Exportiere …" : "JSON exportieren"}
      </button>
      {error && (
        <p className="text-xs text-aw-warning" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
