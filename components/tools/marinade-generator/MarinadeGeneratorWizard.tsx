"use client";

/**
 * @file MarinadeGeneratorWizard.tsx
 * @purpose 6-Schritt-Assistent für Marinaden-Rezepte.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RecipeStatus, RecipeVisibility } from "@prisma/client";

import {
  inputClassName,
  labelClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  sectionCardClassName,
  selectClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";
import {
  createMarinadeApi,
  fetchMarinade,
  generateMarinadePdfApi,
  marinadePdfDownloadUrl,
  updateMarinadeApi,
} from "@/lib/tools/marinade-client";
import { calculateMarinade } from "@/lib/tools/marinade-calculator";
import {
  INTENSITY_LABELS,
  MARINADE_STYLE_LABELS,
  MARINADE_WIZARD_STEPS,
  PREPARATION_LABELS,
  PRODUCT_TYPE_LABELS,
  type MarinadeWizardStepId,
} from "@/lib/tools/marinade-labels";
import {
  buildDefaultIngredients,
  buildDefaultSteps,
  defaultHints,
} from "@/lib/tools/marinade-presets";
import { STATUS_LABELS, VISIBILITY_LABELS } from "@/lib/tools/recipe-labels";
import { getRecipeUserId } from "@/lib/tools/recipe-session";
import type {
  MarinadeIngredientLine,
  MarinadeRecipePayload,
  MarinadeStyle,
} from "@/lib/tools/marinade-types";
import { EMPTY_MARINADE_PAYLOAD } from "@/lib/tools/marinade-types";

type MarinadeGeneratorWizardProps = {
  recipeId?: string;
  demoMode?: boolean;
};

function createIngredientId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `ing-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function MarinadeGeneratorWizard({
  recipeId: initialRecipeId,
  demoMode = false,
}: MarinadeGeneratorWizardProps) {
  const router = useRouter();
  const [recipeId, setRecipeId] = useState(initialRecipeId);
  const [recipeName, setRecipeName] = useState("");
  const [status, setStatus] = useState<RecipeStatus>(RecipeStatus.draft);
  const [visibility, setVisibility] = useState<RecipeVisibility>(
    RecipeVisibility.private,
  );
  const [payload, setPayload] = useState<MarinadeRecipePayload>(
    structuredClone(EMPTY_MARINADE_PAYLOAD),
  );
  const [step, setStep] = useState<MarinadeWizardStepId>("product");
  const [loading, setLoading] = useState(Boolean(initialRecipeId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfStatus, setPdfStatus] = useState<string>("none");

  const calculation = useMemo(() => calculateMarinade(payload), [payload]);
  const stepIndex = MARINADE_WIZARD_STEPS.findIndex((s) => s.id === step);

  const applyPreset = useCallback(
    (style: MarinadeStyle) => {
      setPayload((prev) => ({
        ...prev,
        marinadeStyle: style,
        ingredients: buildDefaultIngredients({
          style,
          productType: prev.productType,
          intensity: prev.intensity,
        }),
        steps: buildDefaultSteps(style),
        hints: defaultHints(prev.productType, style),
      }));
    },
    [],
  );

  useEffect(() => {
    if (!initialRecipeId) {
      applyPreset("oil");
      return;
    }

    let cancelled = false;

    async function load() {
      const userId = getRecipeUserId();
      const response = await fetchMarinade(initialRecipeId!, userId);

      if (cancelled) {
        return;
      }

      if (!response.success) {
        setError(response.error.message);
      } else {
        setRecipeName(response.data.name);
        setPayload(response.data.payload);
        setStatus(response.data.status);
        setVisibility(response.data.visibility);
        setPdfStatus(response.data.pdfStatus);
      }

      setLoading(false);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [initialRecipeId, applyPreset]);

  function updatePayload(patch: Partial<MarinadeRecipePayload>) {
    setPayload((prev) => ({ ...prev, ...patch }));
  }

  function rescaleWeight(newKg: number) {
    updatePayload({ totalWeightKg: newKg });
  }

  function updateIngredient(id: string, patch: Partial<MarinadeIngredientLine>) {
    setPayload((prev) => ({
      ...prev,
      ingredients: prev.ingredients.map((row) =>
        row.id === id ? { ...row, ...patch } : row,
      ),
    }));
  }

  function addIngredient() {
    setPayload((prev) => ({
      ...prev,
      ingredients: [
        ...prev.ingredients,
        {
          id: createIngredientId(),
          name: "",
          amountPerKg: 0,
          unit: "g",
          group: "other",
          isCustom: true,
          sortOrder: prev.ingredients.length + 1,
        },
      ],
    }));
  }

  function removeIngredient(id: string) {
    setPayload((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((row) => row.id !== id),
    }));
  }

  async function handleSave() {
    if (demoMode) {
      setError("Speichern ist im Demo-Modus nicht verfügbar. Bitte Wurst Club / Meisterclub nutzen.");
      return;
    }

    setSaving(true);
    setError(null);

    const userId = getRecipeUserId();
    const name = recipeName.trim() || payload.productName.trim() || "Neue Marinade";

    const body = {
      userId,
      name,
      category: "Marinade",
      description: payload.productName,
      payload,
      status,
      visibility,
    };

    const response = recipeId
      ? await updateMarinadeApi(recipeId, body)
      : await createMarinadeApi(body);

    setSaving(false);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setRecipeId(response.data.id);
    setPdfStatus(response.data.pdfStatus);

    if (!initialRecipeId) {
      router.replace(`/werkstatt/marinaden-generator/${response.data.id}`);
    }
  }

  async function handlePdf() {
    if (demoMode || !recipeId) {
      setError("PDF ist erst nach dem Speichern und mit Premium-Mitgliedschaft verfügbar.");
      return;
    }

    setSaving(true);
    const userId = getRecipeUserId();
    const response = await generateMarinadePdfApi(
      recipeId,
      userId,
      recipeName || payload.productName,
    );
    setSaving(false);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setPdfStatus(response.data.pdfStatus);
    window.open(marinadePdfDownloadUrl(recipeId, userId), "_blank");
  }

  function goNext() {
    const next = MARINADE_WIZARD_STEPS[stepIndex + 1];

    if (next) {
      setStep(next.id);
    }
  }

  function goPrev() {
    const prev = MARINADE_WIZARD_STEPS[stepIndex - 1];

    if (prev) {
      setStep(prev.id);
    }
  }

  if (loading) {
    return <p className="text-sm text-aw-muted">Lade Marinaden-Rezept …</p>;
  }

  return (
    <div className="space-y-8">
      <nav aria-label="Fortschritt" className="flex flex-wrap gap-2">
        {MARINADE_WIZARD_STEPS.map((wizardStep, index) => (
          <button
            key={wizardStep.id}
            type="button"
            onClick={() => setStep(wizardStep.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              wizardStep.id === step
                ? "bg-aw-gold text-aw-bg"
                : index < stepIndex
                  ? "bg-aw-surface-2 text-aw-cream"
                  : "bg-aw-surface text-aw-muted"
            }`}
          >
            {index + 1}. {wizardStep.label}
          </button>
        ))}
      </nav>

      {error && (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}

      {demoMode && (
        <p className="rounded-lg border border-aw-gold/30 bg-aw-gold/10 px-4 py-3 text-sm text-aw-cream">
          Demo-Modus: Alle Schritte sind nutzbar, Speichern und PDF sind gesperrt.
        </p>
      )}

      {step === "product" && (
        <section className={sectionCardClassName}>
          <h2 className="font-display text-xl font-bold text-aw-cream">Produkt & Fleischart</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClassName}>Produktname</label>
              <input
                className={inputClassName}
                value={payload.productName}
                onChange={(e) => updatePayload({ productName: e.target.value })}
                placeholder="z. B. Schweinenacken"
              />
            </div>
            <div>
              <label className={labelClassName}>Fleisch-/Produktart</label>
              <select
                className={selectClassName}
                value={payload.productType}
                onChange={(e) => {
                  const productType = e.target.value as MarinadeRecipePayload["productType"];
                  updatePayload({
                    productType,
                    hints: defaultHints(productType, payload.marinadeStyle),
                  });
                }}
              >
                {Object.entries(PRODUCT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClassName}>Zubereitungsart</label>
              <select
                className={selectClassName}
                value={payload.preparationMethod}
                onChange={(e) =>
                  updatePayload({
                    preparationMethod: e.target
                      .value as MarinadeRecipePayload["preparationMethod"],
                  })
                }
              >
                {Object.entries(PREPARATION_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelClassName}>Rezeptname (für Speicherung)</label>
              <input
                className={inputClassName}
                value={recipeName}
                onChange={(e) => setRecipeName(e.target.value)}
                placeholder={payload.productName || "Meine Marinade"}
              />
            </div>
          </div>
        </section>
      )}

      {step === "style" && (
        <section className={sectionCardClassName}>
          <h2 className="font-display text-xl font-bold text-aw-cream">Marinadenart & Intensität</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClassName}>Marinadenart</label>
              <select
                className={selectClassName}
                value={payload.marinadeStyle}
                onChange={(e) => applyPreset(e.target.value as MarinadeStyle)}
              >
                {Object.entries(MARINADE_STYLE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClassName}>Intensität</label>
              <select
                className={selectClassName}
                value={payload.intensity}
                onChange={(e) => {
                  const intensity = e.target.value as MarinadeRecipePayload["intensity"];
                  updatePayload({
                    intensity,
                    ingredients: buildDefaultIngredients({
                      style: payload.marinadeStyle,
                      productType: payload.productType,
                      intensity,
                    }),
                  });
                }}
              >
                {Object.entries(INTENSITY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClassName}>Ziehzeit</label>
              <input
                className={inputClassName}
                value={payload.marinationTime}
                onChange={(e) => updatePayload({ marinationTime: e.target.value })}
                placeholder="4–8 Stunden"
              />
            </div>
          </div>
        </section>
      )}

      {step === "weight" && (
        <section className={sectionCardClassName}>
          <h2 className="font-display text-xl font-bold text-aw-cream">Gesamtgewicht</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClassName}>Gewicht</label>
              <input
                type="number"
                min={0}
                step={0.1}
                className={inputClassName}
                value={
                  payload.weightInputUnit === "g"
                    ? payload.totalWeightKg * 1000
                    : payload.totalWeightKg
                }
                onChange={(e) => {
                  const raw = Number(e.target.value);

                  if (payload.weightInputUnit === "g") {
                    rescaleWeight(raw / 1000);
                  } else {
                    rescaleWeight(raw);
                  }
                }}
              />
            </div>
            <div>
              <label className={labelClassName}>Einheit</label>
              <select
                className={selectClassName}
                value={payload.weightInputUnit}
                onChange={(e) =>
                  updatePayload({
                    weightInputUnit: e.target.value as "kg" | "g",
                  })
                }
              >
                <option value="kg">Kilogramm (kg)</option>
                <option value="g">Gramm (g)</option>
              </select>
            </div>
          </div>
          <p className="mt-4 text-sm text-aw-muted">
            Gesamt: {calculation.totalWeightGrams.toLocaleString("de-DE")} g — alle Zutaten skalieren automatisch.
          </p>
        </section>
      )}

      {step === "ingredients" && (
        <section className={sectionCardClassName}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl font-bold text-aw-cream">Zutaten & Mengen</h2>
            <button type="button" className={secondaryButtonClassName} onClick={addIngredient}>
              Zutat hinzufügen
            </button>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-aw-border text-aw-muted">
                  <th className="py-2 pr-2">Zutat</th>
                  <th className="py-2 pr-2">g/kg</th>
                  <th className="py-2 pr-2">Einheit</th>
                  <th className="py-2 pr-2">Gesamt</th>
                  <th className="py-2 pr-2">%</th>
                  <th className="py-2">Allergen</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {calculation.ingredients.map((row) => (
                  <tr key={row.id} className="border-b border-aw-border/60">
                    <td className="py-2 pr-2">
                      <input
                        className={inputClassName}
                        value={row.name}
                        onChange={(e) => updateIngredient(row.id, { name: e.target.value })}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="number"
                        min={0}
                        step={0.1}
                        className={inputClassName}
                        value={row.amountPerKg}
                        onChange={(e) =>
                          updateIngredient(row.id, {
                            amountPerKg: Number(e.target.value),
                          })
                        }
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <select
                        className={selectClassName}
                        value={row.unit}
                        onChange={(e) =>
                          updateIngredient(row.id, {
                            unit: e.target.value as "g" | "ml",
                          })
                        }
                      >
                        <option value="g">g</option>
                        <option value="ml">ml</option>
                      </select>
                    </td>
                    <td className="py-2 pr-2 text-aw-cream">
                      {row.totalAmount} {row.unit}
                    </td>
                    <td className="py-2 pr-2 text-aw-muted">{row.percentOfTotal} %</td>
                    <td className="py-2 pr-2">
                      <input
                        className={inputClassName}
                        value={row.allergen ?? ""}
                        onChange={(e) =>
                          updateIngredient(row.id, { allergen: e.target.value || null })
                        }
                        placeholder="optional"
                      />
                    </td>
                    <td className="py-2">
                      <button
                        type="button"
                        className="text-xs text-red-300 hover:text-red-200"
                        onClick={() => removeIngredient(row.id)}
                      >
                        Entfernen
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {calculation.warnings.length > 0 && (
            <ul className="mt-4 space-y-1 text-sm text-amber-200/90">
              {calculation.warnings.map((warning) => (
                <li key={warning}>• {warning}</li>
              ))}
            </ul>
          )}
        </section>
      )}

      {step === "instructions" && (
        <section className={sectionCardClassName}>
          <h2 className="font-display text-xl font-bold text-aw-cream">Herstellung & Hinweise</h2>
          <div className="mt-6 space-y-4">
            {payload.steps.map((stepRow, index) => (
              <div key={`${stepRow.sortOrder}-${index}`} className="rounded-lg border border-aw-border p-4">
                <input
                  className={`${inputClassName} mb-2`}
                  value={stepRow.title}
                  onChange={(e) => {
                    const steps = payload.steps.map((s, i) =>
                      i === index ? { ...s, title: e.target.value } : s,
                    );
                    updatePayload({ steps });
                  }}
                />
                <textarea
                  className={inputClassName}
                  rows={2}
                  value={stepRow.description ?? ""}
                  onChange={(e) => {
                    const steps = payload.steps.map((s, i) =>
                      i === index ? { ...s, description: e.target.value } : s,
                    );
                    updatePayload({ steps });
                  }}
                />
              </div>
            ))}
            <div>
              <label className={labelClassName}>Notizen</label>
              <textarea
                className={inputClassName}
                rows={3}
                value={payload.notes ?? ""}
                onChange={(e) => updatePayload({ notes: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClassName}>Verarbeitungshinweise</label>
              <textarea
                className={inputClassName}
                rows={2}
                value={payload.hints.processing ?? ""}
                onChange={(e) =>
                  updatePayload({
                    hints: { ...payload.hints, processing: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <label className={labelClassName}>Haltbarkeit</label>
              <textarea
                className={inputClassName}
                rows={2}
                value={payload.hints.storage ?? ""}
                onChange={(e) =>
                  updatePayload({
                    hints: { ...payload.hints, storage: e.target.value },
                  })
                }
              />
            </div>
          </div>
        </section>
      )}

      {step === "save" && (
        <section className={sectionCardClassName}>
          <h2 className="font-display text-xl font-bold text-aw-cream">Speichern & PDF</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClassName}>Status</label>
              <select
                className={selectClassName}
                value={status}
                disabled={demoMode}
                onChange={(e) => setStatus(e.target.value as RecipeStatus)}
              >
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClassName}>Sichtbarkeit</label>
              <select
                className={selectClassName}
                value={visibility}
                disabled={demoMode}
                onChange={(e) => setVisibility(e.target.value as RecipeVisibility)}
              >
                {Object.entries(VISIBILITY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-aw-border bg-aw-bg/50 p-4 text-sm text-aw-muted">
            <p>
              <strong className="text-aw-cream">Zusammenfassung:</strong>{" "}
              {MARINADE_STYLE_LABELS[payload.marinadeStyle]} für{" "}
              {PRODUCT_TYPE_LABELS[payload.productType]} — {calculation.totalWeightKg} kg,{" "}
              {calculation.ingredients.length} Zutaten, Marinade gesamt ca.{" "}
              {calculation.totalMarinadeGrams} g.
            </p>
            {pdfStatus !== "none" && (
              <p className="mt-2">PDF-Status: {pdfStatus === "current" ? "Aktuell" : "Veraltet — nach Änderung neu erzeugen"}</p>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              className={primaryButtonClassName}
              disabled={saving || demoMode}
              onClick={() => void handleSave()}
            >
              {recipeId ? "Speichern" : "Rezept anlegen"}
            </button>
            <button
              type="button"
              className={secondaryButtonClassName}
              disabled={saving || demoMode || !recipeId}
              onClick={() => void handlePdf()}
            >
              PDF erzeugen & herunterladen
            </button>
          </div>
        </section>
      )}

      <div className="flex flex-wrap justify-between gap-3">
        <button
          type="button"
          className={secondaryButtonClassName}
          disabled={stepIndex === 0}
          onClick={goPrev}
        >
          Zurück
        </button>
        {step !== "save" ? (
          <button type="button" className={primaryButtonClassName} onClick={goNext}>
            Weiter
          </button>
        ) : (
          <Link href="/werkstatt/marinaden-generator" className={secondaryButtonClassName}>
            Zur Übersicht
          </Link>
        )}
      </div>
    </div>
  );
}
