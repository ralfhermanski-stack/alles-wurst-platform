"use client";

/**
 * @file RecipeJsonImportButton.tsx
 * @purpose Importiert ein Rezept aus einer JSON-Datei als neuen Entwurf.
 */

import { useRef, useState, type ChangeEvent } from "react";

import { secondaryButtonClassName } from "@/components/tools/recipe-generator/recipe-form-classes";
import { createRecipeApi, type ApiRecipe } from "@/lib/tools/recipe-client";
import {
  finalizeRecipeImportInput,
  parseRecipeImportFile,
} from "@/lib/tools/recipe-import-export";
import { getRecipeUserId } from "@/lib/tools/recipe-session";

type RecipeJsonImportButtonProps = {
  className?: string;
  disabled?: boolean;
  onImported?: (recipe: ApiRecipe) => void;
};

const MAX_IMPORT_FILE_SIZE_BYTES = 2 * 1024 * 1024;

/**
 * Öffnet einen Dateidialog und legt ein importiertes Rezept als Entwurf an.
 */
export default function RecipeJsonImportButton({
  className,
  disabled = false,
  onImported,
}: RecipeJsonImportButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openFileDialog() {
    setError(null);
    inputRef.current?.click();
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setError(null);
    setLoading(true);

    try {
      if (!file.name.toLowerCase().endsWith(".json")) {
        setError("Bitte eine JSON-Datei (.json) auswählen.");
        return;
      }

      if (file.size > MAX_IMPORT_FILE_SIZE_BYTES) {
        setError("Die Datei ist zu groß (maximal 2 MB).");
        return;
      }

      const fileText = await file.text();
      const parsed = parseRecipeImportFile(fileText);

      if (!parsed.success) {
        setError(parsed.error);
        return;
      }

      const createInput = finalizeRecipeImportInput(
        parsed.data,
        getRecipeUserId(),
      );

      const response = await createRecipeApi(createInput);

      if (!response.success) {
        setError(response.error.message);
        return;
      }

      onImported?.(response.data);
    } catch {
      setError("Der Import ist fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setLoading(false);
    }
  }

  const buttonClassName = className ?? secondaryButtonClassName;

  return (
    <div className="inline-flex flex-col items-start gap-2">
      <input
        ref={inputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={(event) => void handleFileChange(event)}
      />
      <button
        type="button"
        className={buttonClassName}
        disabled={disabled || loading}
        onClick={openFileDialog}
      >
        {loading ? "Importiere …" : "Rezept importieren"}
      </button>
      {error && (
        <p className="text-xs text-aw-warning" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
