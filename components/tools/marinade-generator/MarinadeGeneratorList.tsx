"use client";

/**
 * @file MarinadeGeneratorList.tsx
 */

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import MembershipBlockedNotice from "@/components/membership/MembershipBlockedNotice";
import {
  dangerButtonClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";
import {
  deleteMarinadeApi,
  duplicateMarinadeApi,
  fetchMarinadeList,
  generateMarinadePdfApi,
  marinadePdfDownloadUrl,
  type ApiMarinade,
} from "@/lib/tools/marinade-client";
import { STATUS_LABELS, VISIBILITY_LABELS } from "@/lib/tools/recipe-labels";
import { getRecipeUserId } from "@/lib/tools/recipe-session";
import { useMembershipAccess } from "@/lib/membership/use-membership-access";
import { MARINADE_STYLE_LABELS } from "@/lib/tools/marinade-labels";

const PDF_STATUS_LABELS = {
  none: "Kein PDF",
  current: "Aktuell",
  outdated: "Veraltet",
} as const;

function formatKg(value: number | null): string {
  if (value === null || value <= 0) {
    return "—";
  }

  return `${new Intl.NumberFormat("de-DE", { maximumFractionDigits: 3 }).format(value)} kg`;
}

export default function MarinadeGeneratorList() {
  const router = useRouter();
  const membership = useMembershipAccess();
  const useCheck = membership.check("marinade.use");
  const saveCheck = membership.check("marinade.save");
  const pdfCheck = membership.check("marinade.pdf");
  const [recipes, setRecipes] = useState<ApiMarinade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    if (!useCheck.allowed) {
      return;
    }

    let cancelled = false;

    async function load() {
      const userId = getRecipeUserId();
      const response = await fetchMarinadeList(userId);

      if (cancelled) {
        return;
      }

      if (!response.success) {
        setError(response.error.message);
        setRecipes([]);
      } else {
        setError(null);
        setRecipes(response.data);
      }

      setLoading(false);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [useCheck.allowed]);

  async function reload() {
    setLoading(true);
    const userId = getRecipeUserId();
    const response = await fetchMarinadeList(userId);

    if (!response.success) {
      setError(response.error.message);
      setRecipes([]);
    } else {
      setError(null);
      setRecipes(response.data);
    }

    setLoading(false);
  }

  async function handleDuplicate(id: string) {
    setActionId(id);
    const userId = getRecipeUserId();
    const response = await duplicateMarinadeApi(id, userId);
    setActionId(null);

    if (response.success) {
      router.push(`/werkstatt/marinaden-generator/${response.data.id}`);
    } else {
      setError(response.error.message);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Marinaden-Rezept wirklich löschen?")) {
      return;
    }

    setActionId(id);
    const userId = getRecipeUserId();
    const response = await deleteMarinadeApi(id, userId);
    setActionId(null);

    if (response.success) {
      await reload();
    } else {
      setError(response.error.message);
    }
  }

  async function handlePdf(id: string, name: string) {
    setActionId(id);
    const userId = getRecipeUserId();
    const response = await generateMarinadePdfApi(id, userId, name);
    setActionId(null);

    if (response.success) {
      window.open(marinadePdfDownloadUrl(id, userId), "_blank");
      await reload();
    } else {
      setError(response.error.message);
    }
  }

  if (!useCheck.allowed) {
    return <MembershipBlockedNotice message={useCheck.message} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-aw-cream">
            Meine Marinaden
          </h2>
          <p className="mt-1 text-sm text-aw-muted">
            Gespeicherte Marinaden-Rezepte verwalten, bearbeiten und als PDF exportieren.
          </p>
        </div>

        {saveCheck.allowed ? (
          <Link href="/werkstatt/marinaden-generator/neu" className={primaryButtonClassName}>
            Neue Marinade
          </Link>
        ) : (
          <Link href="/werkstatt/marinaden-generator/neu" className={secondaryButtonClassName}>
            Demo starten
          </Link>
        )}
      </div>

      {!saveCheck.allowed && (
        <p className="rounded-lg border border-aw-gold/30 bg-aw-gold/10 px-4 py-3 text-sm text-aw-cream">
          Demo-Modus: Du kannst den Assistenten testen. Speichern und PDF sind ab Wurst Club / Meisterclub verfügbar.
        </p>
      )}

      {error && (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-aw-muted">Lade Marinaden …</p>
      ) : recipes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-aw-border bg-aw-surface/40 p-10 text-center">
          <p className="text-aw-muted">Noch keine Marinaden gespeichert.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {recipes.map((recipe) => (
            <li
              key={recipe.id}
              className="flex flex-col gap-4 rounded-xl border border-aw-border bg-aw-surface p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <Link
                  href={`/werkstatt/marinaden-generator/${recipe.id}`}
                  className="font-display text-lg font-bold text-aw-cream hover:text-aw-gold"
                >
                  {recipe.name}
                </Link>
                <p className="mt-1 text-sm text-aw-muted">
                  {MARINADE_STYLE_LABELS[recipe.payload.marinadeStyle]} · {formatKg(recipe.totalWeightKg)} ·{" "}
                  {STATUS_LABELS[recipe.status]} · {VISIBILITY_LABELS[recipe.visibility]}
                </p>
                <p className="mt-1 text-xs text-aw-muted">
                  PDF: {PDF_STATUS_LABELS[recipe.pdfStatus as keyof typeof PDF_STATUS_LABELS] ?? recipe.pdfStatus} · Version {recipe.version}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/werkstatt/marinaden-generator/${recipe.id}`}
                  className={secondaryButtonClassName}
                >
                  Bearbeiten
                </Link>
                {saveCheck.allowed && (
                  <button
                    type="button"
                    className={secondaryButtonClassName}
                    disabled={actionId === recipe.id}
                    onClick={() => void handleDuplicate(recipe.id)}
                  >
                    Duplizieren
                  </button>
                )}
                {pdfCheck.allowed && (
                  <button
                    type="button"
                    className={secondaryButtonClassName}
                    disabled={actionId === recipe.id}
                    onClick={() => void handlePdf(recipe.id, recipe.name)}
                  >
                    {recipe.hasPdf ? "PDF neu" : "PDF"}
                  </button>
                )}
                {recipe.hasPdf && pdfCheck.allowed && (
                  <a
                    href={marinadePdfDownloadUrl(recipe.id, getRecipeUserId())}
                    className={secondaryButtonClassName}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download
                  </a>
                )}
                {saveCheck.allowed && (
                  <button
                    type="button"
                    className={dangerButtonClassName}
                    disabled={actionId === recipe.id}
                    onClick={() => void handleDelete(recipe.id)}
                  >
                    Löschen
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
