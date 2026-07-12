"use client";

/**
 * @file RecipeDatabaseCopyButton.tsx
 * @purpose Kopiert ein offizielles Rezept in die eigenen Rezepte.
 */

import { useRouter } from "next/navigation";
import { useState } from "react";

import { primaryButtonClassName } from "@/components/tools/recipe-generator/recipe-form-classes";
import { useMembershipAccess } from "@/lib/membership/use-membership-access";
import { copyOfficialRecipeApi } from "@/lib/tools/recipe-client";
import { getRecipeUserId } from "@/lib/tools/recipe-session";

type RecipeDatabaseCopyButtonProps = {
  recipeId: string;
  className?: string;
};

/**
 * Legt eine private Entwurfs-Kopie des offiziellen Rezepts an.
 */
export default function RecipeDatabaseCopyButton({
  recipeId,
  className,
}: RecipeDatabaseCopyButtonProps) {
  const router = useRouter();
  const membership = useMembershipAccess();
  const copyCheck = membership.check("recipe.database.copy");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCopy() {
    if (!copyCheck.allowed) {
      setError(copyCheck.message);
      return;
    }

    setLoading(true);
    setError(null);

    const response = await copyOfficialRecipeApi(recipeId, getRecipeUserId());

    setLoading(false);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    router.push(`/werkstatt/rezeptgenerator/${response.data.id}`);
  }

  const buttonClassName = className ?? primaryButtonClassName;

  return (
    <div className="space-y-2">
      <button
        type="button"
        className={`${buttonClassName}${copyCheck.allowed ? "" : " cursor-not-allowed opacity-50"}`}
        disabled={loading || !copyCheck.allowed}
        title={!copyCheck.allowed ? copyCheck.message : undefined}
        onClick={() => void handleCopy()}
      >
        {loading ? "Kopiere …" : "In meine Rezepte kopieren"}
      </button>
      {!copyCheck.allowed && (
        <p className="text-xs text-aw-muted">{copyCheck.message}</p>
      )}
      {error && (
        <p className="text-sm text-aw-warning" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
