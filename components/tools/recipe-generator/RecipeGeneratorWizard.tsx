"use client";

/**
 * @file RecipeGeneratorWizard.tsx
 * @purpose Mehrstufiger Rezept-Wizard mit Live-Berechnung und API-Speicherung.
 * @usage `/werkstatt/rezeptgenerator/neu` und `/werkstatt/rezeptgenerator/[id]`.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RecipeStatus, RecipeVisibility } from "@prisma/client";

import Icon from "@/components/brand/Icon";
import { useAuth } from "@/lib/auth/use-auth";
import RecipeLiveSummary from "@/components/tools/recipe-generator/RecipeLiveSummary";
import RecipeCategorySelect from "@/components/tools/recipe-generator/RecipeCategorySelect";
import RecipeJsonExportButton from "@/components/tools/recipe-generator/RecipeJsonExportButton";
import RecipePdfExportButton from "@/components/tools/recipe-generator/RecipePdfExportButton";
import { ShareButton } from "@/components/sharing/ShareModal";
import RecipePlausibilityList from "@/components/tools/recipe-generator/RecipePlausibilityList";
import {
  dangerButtonClassName,
  inputClassName,
  labelClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  sectionCardClassName,
  selectClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";
import {
  createRecipeApi,
  fetchRecipe,
  updateRecipeApi,
  updateRecipeStatusApi,
  updateRecipeVisibilityApi,
  uploadRecipeImageApi,
} from "@/lib/tools/recipe-client";
import {
  fetchAdminRecipe,
  updateAdminRecipeApi,
  uploadAdminRecipeImageApi,
} from "@/lib/admin/admin-client";
import {
  REFERENCE_BASIS_LABELS,
  STATUS_LABELS,
  VISIBILITY_LABELS,
  WIZARD_STEPS,
  type WizardStepId,
} from "@/lib/tools/recipe-labels";
import { getRecipeUserId } from "@/lib/tools/recipe-session";
import { calculateRecipePayload } from "@/lib/tools/recipe-calculator";
import { checkRecipePlausibility } from "@/lib/tools/recipe-plausibility";
import {
  SMOKING_DIMENSIONS,
  STRUCTURE_DIMENSIONS,
  createEmptyMeatClassification,
  type IngredientReferenceBasis,
  type MeatClassification,
  type RecipeBinderLine,
  type RecipeIngredientLine,
  type RecipeMeatLine,
  type RecipePayload,
  type RecipeProductionStep,
  type RecipeSmokingPhase,
} from "@/lib/tools/recipe-types";

type RecipeGeneratorWizardProps = {
  /** Bestehende Rezept-ID — fehlt bei „Neu" */
  recipeId?: string;
  /** Admin-Bearbeitung ohne Besitzerprüfung */
  adminMode?: boolean;
};

const inputSmClassName =
  "w-full rounded-lg border border-aw-border bg-aw-bg px-3 py-2 text-sm text-aw-cream focus:border-aw-gold focus:outline-none focus:ring-1 focus:ring-aw-gold/40";

/**
 * Rezept-Wizard mit 8 Schritten und Live-Berechnung.
 */
export default function RecipeGeneratorWizard({
  recipeId: initialRecipeId,
  adminMode = false,
}: RecipeGeneratorWizardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const showDatabaseFlags =
    user?.profile?.publicName === "Fleischermeister_Ralf";
  const [recipeId, setRecipeId] = useState<string | undefined>(initialRecipeId);
  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(Boolean(initialRecipeId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [totalWeightKg, setTotalWeightKg] = useState("");
  const [status, setStatus] = useState<RecipeStatus>(RecipeStatus.draft);
  const [visibility, setVisibility] = useState<RecipeVisibility>(
    RecipeVisibility.private,
  );

  // Spezielle Flags für die Rezeptdatenbank (nur Fleischermeister_Ralf).
  const [isRecipeOfMonth, setIsRecipeOfMonth] = useState(false);
  const [isCourseLinked, setIsCourseLinked] = useState(false);
  const [isMeisterclubSpecial, setIsMeisterclubSpecial] = useState(false);

  const [meats, setMeats] = useState<RecipeMeatLine[]>([]);
  const [binders, setBinders] = useState<RecipeBinderLine[]>([]);
  const [waterGPerKg, setWaterGPerKg] = useState("");
  const [nitriteMgPerKg, setNitriteMgPerKg] = useState("");
  const [ingredients, setIngredients] = useState<RecipeIngredientLine[]>([]);
  const [casingType, setCasingType] = useState("");
  const [casingCaliber, setCasingCaliber] = useState("");
  const [productionSteps, setProductionSteps] = useState<RecipeProductionStep[]>(
    [],
  );
  const [productionNotes, setProductionNotes] = useState("");
  const [smokingPhases, setSmokingPhases] = useState<RecipeSmokingPhase[]>([]);
  const [smokingNotes, setSmokingNotes] = useState("");

  const [hasImage, setHasImage] = useState(false);
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageVersion, setImageVersion] = useState(0);

  const currentStep = WIZARD_STEPS[stepIndex];

  async function handleImageUpload(file: File) {
    if (!recipeId) {
      return;
    }

    setImageUploading(true);
    setError(null);

    const formData = new FormData();
    formData.set("file", file);

    const response = adminMode
      ? await uploadAdminRecipeImageApi(recipeId, formData)
      : await uploadRecipeImageApi(recipeId, formData);
    setImageUploading(false);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setHasImage(response.data.hasImage);
    setImageFileName(response.data.imageFileName);
    setImageVersion((value) => value + 1);
  }

  /** Baut den RecipePayload aus dem Formularzustand */
  const payload = useMemo((): RecipePayload => {
    const weight = Number(totalWeightKg.replace(",", ".")) || 0;

    const result: RecipePayload = {
      calculation: { totalWeightKg: weight },
      meats,
      binders,
      ingredients,
    };

    if (waterGPerKg || nitriteMgPerKg) {
      result.schuettung = {
        waterGPerKg: waterGPerKg ? Number(waterGPerKg.replace(",", ".")) : undefined,
        nitriteMgPerKg: nitriteMgPerKg
          ? Number(nitriteMgPerKg.replace(",", "."))
          : undefined,
      };
    }

    if (casingType.trim()) {
      result.casing = {
        casingType: casingType.trim(),
        caliberMm: casingCaliber
          ? Number(casingCaliber.replace(",", "."))
          : undefined,
      };
    }

    if (productionSteps.length > 0 || productionNotes.trim()) {
      result.production = {
        steps: productionSteps.length > 0 ? productionSteps : undefined,
        notes: productionNotes.trim() || undefined,
      };
    }

    if (smokingPhases.length > 0 || smokingNotes.trim()) {
      result.smoking = {
        phases: smokingPhases.length > 0 ? smokingPhases : undefined,
        notes: smokingNotes.trim() || undefined,
      };
    }

    return result;
  }, [
    totalWeightKg,
    meats,
    binders,
    ingredients,
    waterGPerKg,
    nitriteMgPerKg,
    casingType,
    casingCaliber,
    productionSteps,
    productionNotes,
    smokingPhases,
    smokingNotes,
  ]);

  const smokingActive =
    smokingPhases.length > 0 || smokingNotes.trim().length > 0;

  const smokingIncomplete =
    smokingPhases.length > 0 &&
    smokingPhases.some(
      (phase) =>
        !phase.name.trim() ||
        phase.temperatureC === undefined ||
        phase.durationMin === undefined,
    );

  const plausibilityContext = useMemo(
    () => ({
      payload,
      category,
      casingType,
      productionStepCount: productionSteps.filter((step) =>
        step.title.trim(),
      ).length,
      smokingActive,
      smokingIncomplete,
    }),
    [
      payload,
      category,
      casingType,
      productionSteps,
      smokingActive,
      smokingIncomplete,
    ],
  );

  const plausibilityResult = useMemo(() => {
    const calculation = calculateRecipePayload(payload);

    return checkRecipePlausibility(plausibilityContext, calculation);
  }, [plausibilityContext, payload]);

  const hydrateFromApi = useCallback(
    (data: {
      name: string;
      category: string | null;
      description: string | null;
      status: RecipeStatus;
      visibility: RecipeVisibility;
      isRecipeOfMonth: boolean;
      isCourseLinked: boolean;
      isMeisterclubSpecial: boolean;
      payload: RecipePayload;
      hasImage?: boolean;
      imageFileName?: string | null;
    }) => {
      setName(data.name);
      setCategory(data.category ?? "");
      setDescription(data.description ?? "");
      setStatus(data.status);
      setVisibility(data.visibility);
      setIsRecipeOfMonth(Boolean(data.isRecipeOfMonth));
      setIsCourseLinked(Boolean(data.isCourseLinked));
      setIsMeisterclubSpecial(Boolean(data.isMeisterclubSpecial));
      setHasImage(Boolean(data.hasImage));
      setImageFileName(data.imageFileName ?? null);
      setTotalWeightKg(
        data.payload.calculation.totalWeightKg > 0
          ? String(data.payload.calculation.totalWeightKg)
          : "",
      );
      setMeats(data.payload.meats);
      setBinders(data.payload.binders);
      setIngredients(data.payload.ingredients);
      setWaterGPerKg(
        data.payload.schuettung?.waterGPerKg !== undefined
          ? String(data.payload.schuettung.waterGPerKg)
          : "",
      );
      setNitriteMgPerKg(
        data.payload.schuettung?.nitriteMgPerKg !== undefined
          ? String(data.payload.schuettung.nitriteMgPerKg)
          : "",
      );
      setCasingType(data.payload.casing?.casingType ?? "");
      setCasingCaliber(
        data.payload.casing?.caliberMm !== undefined
          ? String(data.payload.casing.caliberMm)
          : "",
      );
      setProductionSteps(data.payload.production?.steps ?? []);
      setProductionNotes(data.payload.production?.notes ?? "");
      setSmokingPhases(data.payload.smoking?.phases ?? []);
      setSmokingNotes(data.payload.smoking?.notes ?? "");
    },
    [],
  );

  useEffect(() => {
    if (!initialRecipeId) {
      return;
    }

    const id = initialRecipeId;
    let cancelled = false;

    async function load() {
      const response = adminMode
        ? await fetchAdminRecipe(id)
        : await fetchRecipe(id, getRecipeUserId());

      if (cancelled) {
        return;
      }

      if (!response.success) {
        setError(response.error.message);
      } else {
        hydrateFromApi(response.data);
      }

      setLoading(false);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [initialRecipeId, hydrateFromApi, adminMode]);

  async function persistRecipe(
    targetStatus: RecipeStatus,
  ): Promise<boolean> {
    setSaving(true);
    setError(null);
    setSuccess(null);

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Bitte gib einen Rezeptnamen ein (Schritt Grunddaten).");
      setSaving(false);
      setStepIndex(0);
      return false;
    }

    if (
      !adminMode &&
      targetStatus === RecipeStatus.saved &&
      plausibilityResult.hasBlocking
    ) {
      setError(
        "Bitte behebe die rot markierten Punkte in der Prüfliste, bevor du das Rezept speicherst. Einen Entwurf kannst du trotzdem speichern.",
      );
      setSaving(false);
      setStepIndex(WIZARD_STEPS.length - 1);
      return false;
    }

    const userId = getRecipeUserId();

    if (recipeId && adminMode) {
      const response = await updateAdminRecipeApi(recipeId, {
        name: trimmedName,
        category: category.trim() || null,
        description: description.trim() || null,
        payload,
        status: targetStatus,
        visibility,
      });

      if (!response.success) {
        setError(response.error.message);
        setSaving(false);
        return false;
      }

      setStatus(response.data.status);
      setVisibility(response.data.visibility);
      setSuccess(
        targetStatus === RecipeStatus.draft
          ? "Entwurf gespeichert (Admin)."
          : "Rezept gespeichert (Admin).",
      );
      setSaving(false);
      return true;
    }

    if (recipeId) {
      const response = await updateRecipeApi(recipeId, {
        userId,
        name: trimmedName,
        category: category.trim() || null,
        description: description.trim() || null,
        payload,
        ...(showDatabaseFlags
          ? {
              isRecipeOfMonth,
              isCourseLinked,
              isMeisterclubSpecial,
            }
          : {}),
      });

      if (!response.success) {
        setError(response.error.message);
        setSaving(false);
        return false;
      }

      if (response.data.status !== targetStatus) {
        const statusRes = await updateRecipeStatusApi(
          recipeId,
          userId,
          targetStatus,
        );

        if (!statusRes.success) {
          setError(statusRes.error.message);
          setSaving(false);
          return false;
        }
      }

      setStatus(targetStatus);
      setSuccess(
        targetStatus === RecipeStatus.draft
          ? "Entwurf gespeichert."
          : "Rezept gespeichert.",
      );
      setSaving(false);
      return true;
    }

    const response = await createRecipeApi({
      userId,
      name: trimmedName,
      category: category.trim() || null,
      description: description.trim() || null,
      payload,
      status: targetStatus,
      visibility,
      ...(showDatabaseFlags
        ? {
            isRecipeOfMonth,
            isCourseLinked,
            isMeisterclubSpecial,
          }
        : {}),
    });

    if (!response.success) {
      setError(response.error.message);
      setSaving(false);
      return false;
    }

    setRecipeId(response.data.id);
    setStatus(response.data.status);
    setSuccess("Rezept angelegt und gespeichert.");
    router.replace(`/werkstatt/rezeptgenerator/${response.data.id}`);
    setSaving(false);
    return true;
  }

  async function handleStatusChange(next: RecipeStatus) {
    if (
      !adminMode &&
      next === RecipeStatus.saved &&
      plausibilityResult.hasBlocking
    ) {
      setError(
        "Der Status „Gespeichert“ ist erst möglich, wenn die blockierenden Hinweise in der Prüfliste behoben sind.",
      );
      setStepIndex(WIZARD_STEPS.length - 1);
      return;
    }

    if (!recipeId) {
      setStatus(next);
      return;
    }

    setSaving(true);
    setError(null);

    if (adminMode) {
      const response = await updateAdminRecipeApi(recipeId, { status: next });
      setSaving(false);

      if (!response.success) {
        setError(response.error.message);
        return;
      }

      setStatus(next);
      setSuccess(`Status geändert: ${STATUS_LABELS[next]}`);
      return;
    }

    const response = await updateRecipeStatusApi(
      recipeId,
      getRecipeUserId(),
      next,
    );
    setSaving(false);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setStatus(next);
    setSuccess(`Status geändert: ${STATUS_LABELS[next]}`);
  }

  async function handleVisibilityChange(next: RecipeVisibility) {
    if (!recipeId) {
      setVisibility(next);
      return;
    }

    setSaving(true);
    setError(null);

    if (adminMode) {
      const response = await updateAdminRecipeApi(recipeId, {
        visibility: next,
      });
      setSaving(false);

      if (!response.success) {
        setError(response.error.message);
        return;
      }

      setVisibility(next);
      setSuccess(`Sichtbarkeit geändert: ${VISIBILITY_LABELS[next]}`);
      return;
    }

    const response = await updateRecipeVisibilityApi(
      recipeId,
      getRecipeUserId(),
      next,
    );
    setSaving(false);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setVisibility(next);
    setSuccess(`Sichtbarkeit geändert: ${VISIBILITY_LABELS[next]}`);
  }

  function addMeatLine() {
    setMeats((prev) => [
      ...prev,
      {
        meatType: "",
        percentage: 0,
        classification: createEmptyMeatClassification(),
        sortOrder: prev.length + 1,
      },
    ]);
  }

  function addBinderLine() {
    setBinders((prev) => [
      ...prev,
      {
        binderType: "",
        percentage: 0,
        sortOrder: prev.length + 1,
      },
    ]);
  }

  function addIngredientLine() {
    setIngredients((prev) => [
      ...prev,
      {
        name: "",
        amountPerKg: 0,
        referenceBasis: "total" as IngredientReferenceBasis,
        unit: "g/kg",
        sortOrder: prev.length + 1,
      },
    ]);
  }

  function renderStepContent(stepId: WizardStepId) {
    switch (stepId) {
      case "grunddaten":
        return (
          <div className="space-y-5">
            <div>
              <label htmlFor="recipe-name" className={labelClassName}>
                Rezeptname *
              </label>
              <input
                id="recipe-name"
                className={`${inputClassName} mt-2`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="z. B. Hausmacher Bratwurst"
              />
            </div>
            <div>
              <label htmlFor="recipe-category" className={labelClassName}>
                Kategorie
              </label>
              <RecipeCategorySelect
                id="recipe-category"
                className="mt-2"
                value={category}
                onChange={setCategory}
                allowEmpty
                emptyLabel="Kategorie wählen …"
              />
            </div>
            <div>
              <label htmlFor="recipe-description" className={labelClassName}>
                Beschreibung
              </label>
              <textarea
                id="recipe-description"
                rows={3}
                className={`${inputClassName} mt-2 resize-y`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Kurznotizen zum Rezept …"
              />
            </div>
            <div>
              <label htmlFor="recipe-weight" className={labelClassName}>
                Gesamtgewicht der Charge (kg) *
              </label>
              <input
                id="recipe-weight"
                type="text"
                inputMode="decimal"
                className={`${inputClassName} mt-2`}
                value={totalWeightKg}
                onChange={(e) => setTotalWeightKg(e.target.value)}
                placeholder="z. B. 10"
              />
              <p className="mt-2 text-xs text-aw-muted">
                Basis für alle Gewichts- und Zutatenberechnungen.
              </p>
            </div>

            <div>
              <label className={labelClassName}>Produktbild</label>
              {recipeId ? (
                <>
                  <p className="mt-1 text-xs text-aw-muted">
                    Erscheint im PDF-Export und auf geteilten Rezeptseiten (JPG,
                    PNG oder WebP).
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-4">
                    {hasImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`/api/recipes/${recipeId}/image?v=${imageVersion}`}
                        alt="Rezeptbild"
                        className="h-32 w-48 rounded-lg border border-aw-border object-cover"
                      />
                    )}
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        className="text-sm text-aw-muted"
                        onChange={(e) => {
                          const file = e.target.files?.[0];

                          if (file) {
                            void handleImageUpload(file);
                          }
                        }}
                      />
                      {imageUploading && (
                        <p className="mt-2 text-xs text-aw-muted">
                          Bild wird hochgeladen …
                        </p>
                      )}
                      {imageFileName && (
                        <p className="mt-2 text-xs text-aw-muted">
                          Aktuell: {imageFileName}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <p className="mt-1 text-xs text-aw-muted">
                  Speichere das Rezept zuerst, danach kannst du ein Bild
                  hochladen.
                </p>
              )}
            </div>
          </div>
        );

      case "fleisch":
        return (
          <div className="space-y-4">
            <p className="text-sm text-aw-muted">
              Fleischsorten mit Prozentanteil und Technologie-Klassifizierung
              (S1–S10, R1–R5).
            </p>
            {meats.map((line, index) => (
              <div key={index} className={sectionCardClassName}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClassName}>Fleischsorte</label>
                    <input
                      className={`${inputSmClassName} mt-1`}
                      value={line.meatType}
                      onChange={(e) => {
                        const next = [...meats];
                        next[index] = { ...line, meatType: e.target.value };
                        setMeats(next);
                      }}
                      placeholder="z. B. Schweinebauch"
                    />
                  </div>
                  <div>
                    <label className={labelClassName}>Anteil %</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      className={`${inputSmClassName} mt-1`}
                      value={line.percentage || ""}
                      onChange={(e) => {
                        const next = [...meats];
                        next[index] = {
                          ...line,
                          percentage: Number(e.target.value.replace(",", ".")) || 0,
                        };
                        setMeats(next);
                      }}
                    />
                  </div>
                </div>
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-semibold text-aw-gold">
                    Klassifizierung S1–S10 / R1–R5
                  </summary>
                  <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {[
                      ...STRUCTURE_DIMENSIONS,
                      ...SMOKING_DIMENSIONS,
                    ].map((dim) => (
                      <div key={dim}>
                        <label className="text-xs text-aw-muted">{dim}</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          className={`${inputSmClassName} mt-0.5`}
                          value={line.classification[dim as keyof MeatClassification] || ""}
                          onChange={(e) => {
                            const next = [...meats];
                            const classification = { ...line.classification };
                            classification[dim as keyof MeatClassification] =
                              Number(e.target.value.replace(",", ".")) || 0;
                            next[index] = { ...line, classification };
                            setMeats(next);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </details>
                <button
                  type="button"
                  className={`${dangerButtonClassName} mt-4`}
                  onClick={() =>
                    setMeats((prev) => prev.filter((_, i) => i !== index))
                  }
                >
                  Zeile entfernen
                </button>
              </div>
            ))}
            <button type="button" className={secondaryButtonClassName} onClick={addMeatLine}>
              + Fleischzeile
            </button>
          </div>
        );

      case "schuettung":
        return (
          <div className="space-y-4">
            {binders.map((line, index) => (
              <div key={index} className={`${sectionCardClassName} grid gap-4 sm:grid-cols-2`}>
                <div>
                  <label className={labelClassName}>Bindemittel</label>
                  <input
                    className={`${inputSmClassName} mt-1`}
                    value={line.binderType}
                    onChange={(e) => {
                      const next = [...binders];
                      next[index] = { ...line, binderType: e.target.value };
                      setBinders(next);
                    }}
                    placeholder="z. B. Eis"
                  />
                </div>
                <div>
                  <label className={labelClassName}>Anteil %</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    className={`${inputSmClassName} mt-1`}
                    value={line.percentage || ""}
                    onChange={(e) => {
                      const next = [...binders];
                      next[index] = {
                        ...line,
                        percentage: Number(e.target.value.replace(",", ".")) || 0,
                      };
                      setBinders(next);
                    }}
                  />
                </div>
                <button
                  type="button"
                  className={`${dangerButtonClassName} sm:col-span-2`}
                  onClick={() =>
                    setBinders((prev) => prev.filter((_, i) => i !== index))
                  }
                >
                  Zeile entfernen
                </button>
              </div>
            ))}
            <button type="button" className={secondaryButtonClassName} onClick={addBinderLine}>
              + Schüttungszeile
            </button>
            <div className={sectionCardClassName}>
              <h4 className="text-sm font-semibold text-aw-cream">
                Technische Werte (optional)
              </h4>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClassName}>Wasser g/kg</label>
                  <input
                    className={`${inputSmClassName} mt-1`}
                    value={waterGPerKg}
                    onChange={(e) => setWaterGPerKg(e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClassName}>Nitrit mg/kg</label>
                  <input
                    className={`${inputSmClassName} mt-1`}
                    value={nitriteMgPerKg}
                    onChange={(e) => setNitriteMgPerKg(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case "gewuerze":
        return (
          <div className="space-y-4">
            {ingredients.map((line, index) => (
              <div key={index} className={`${sectionCardClassName} grid gap-4 sm:grid-cols-2`}>
                <div>
                  <label className={labelClassName}>Zutat</label>
                  <input
                    className={`${inputSmClassName} mt-1`}
                    value={line.name}
                    onChange={(e) => {
                      const next = [...ingredients];
                      next[index] = { ...line, name: e.target.value };
                      setIngredients(next);
                    }}
                    placeholder="z. B. Salz"
                  />
                </div>
                <div>
                  <label className={labelClassName}>Menge g/kg</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    className={`${inputSmClassName} mt-1`}
                    value={line.amountPerKg || ""}
                    onChange={(e) => {
                      const next = [...ingredients];
                      next[index] = {
                        ...line,
                        amountPerKg: Number(e.target.value.replace(",", ".")) || 0,
                      };
                      setIngredients(next);
                    }}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClassName}>Bezugsbasis</label>
                  <select
                    className={`${selectClassName} mt-1`}
                    value={line.referenceBasis}
                    onChange={(e) => {
                      const next = [...ingredients];
                      next[index] = {
                        ...line,
                        referenceBasis: e.target.value as IngredientReferenceBasis,
                      };
                      setIngredients(next);
                    }}
                  >
                    {(Object.keys(REFERENCE_BASIS_LABELS) as IngredientReferenceBasis[]).map(
                      (key) => (
                        <option key={key} value={key}>
                          {REFERENCE_BASIS_LABELS[key]}
                        </option>
                      ),
                    )}
                  </select>
                </div>
                <button
                  type="button"
                  className={`${dangerButtonClassName} sm:col-span-2`}
                  onClick={() =>
                    setIngredients((prev) => prev.filter((_, i) => i !== index))
                  }
                >
                  Zeile entfernen
                </button>
              </div>
            ))}
            <button type="button" className={secondaryButtonClassName} onClick={addIngredientLine}>
              + Zutat
            </button>
          </div>
        );

      case "daerme":
        return (
          <div className="space-y-5">
            <div>
              <label htmlFor="casing-type" className={labelClassName}>
                Darmtyp
              </label>
              <input
                id="casing-type"
                className={`${inputClassName} mt-2`}
                value={casingType}
                onChange={(e) => setCasingType(e.target.value)}
                placeholder="z. B. Schweinedarm 32 mm"
              />
            </div>
            <div>
              <label htmlFor="casing-caliber" className={labelClassName}>
                Kaliber (mm)
              </label>
              <input
                id="casing-caliber"
                type="text"
                inputMode="decimal"
                className={`${inputClassName} mt-2`}
                value={casingCaliber}
                onChange={(e) => setCasingCaliber(e.target.value)}
              />
            </div>
          </div>
        );

      case "herstellung":
        return (
          <div className="space-y-4">
            {productionSteps.map((step, index) => (
              <div key={index} className={sectionCardClassName}>
                <input
                  className={`${inputSmClassName} mb-2`}
                  value={step.title}
                  onChange={(e) => {
                    const next = [...productionSteps];
                    next[index] = { ...step, title: e.target.value };
                    setProductionSteps(next);
                  }}
                  placeholder="Schritt-Titel"
                />
                <textarea
                  rows={2}
                  className={`${inputSmClassName} resize-y`}
                  value={step.description ?? ""}
                  onChange={(e) => {
                    const next = [...productionSteps];
                    next[index] = { ...step, description: e.target.value };
                    setProductionSteps(next);
                  }}
                  placeholder="Beschreibung (optional)"
                />
                <button
                  type="button"
                  className={`${dangerButtonClassName} mt-2`}
                  onClick={() =>
                    setProductionSteps((prev) => prev.filter((_, i) => i !== index))
                  }
                >
                  Schritt entfernen
                </button>
              </div>
            ))}
            <button
              type="button"
              className={secondaryButtonClassName}
              onClick={() =>
                setProductionSteps((prev) => [...prev, { title: "" }])
              }
            >
              + Arbeitsschritt
            </button>
            <div>
              <label className={labelClassName}>Notizen</label>
              <textarea
                rows={3}
                className={`${inputClassName} mt-2 resize-y`}
                value={productionNotes}
                onChange={(e) => setProductionNotes(e.target.value)}
              />
            </div>
          </div>
        );

      case "rauchern":
        return (
          <div className="space-y-4">
            <p className="text-sm text-aw-muted">Optional — nur bei geräucherten Würsten.</p>
            {smokingPhases.map((phase, index) => (
              <div key={index} className={`${sectionCardClassName} grid gap-3 sm:grid-cols-3`}>
                <input
                  className={inputSmClassName}
                  value={phase.name}
                  onChange={(e) => {
                    const next = [...smokingPhases];
                    next[index] = { ...phase, name: e.target.value };
                    setSmokingPhases(next);
                  }}
                  placeholder="Phase"
                />
                <input
                  className={inputSmClassName}
                  value={phase.temperatureC ?? ""}
                  onChange={(e) => {
                    const next = [...smokingPhases];
                    next[index] = {
                      ...phase,
                      temperatureC: Number(e.target.value.replace(",", ".")) || undefined,
                    };
                    setSmokingPhases(next);
                  }}
                  placeholder="°C"
                />
                <input
                  className={inputSmClassName}
                  value={phase.durationMin ?? ""}
                  onChange={(e) => {
                    const next = [...smokingPhases];
                    next[index] = {
                      ...phase,
                      durationMin: Number(e.target.value.replace(",", ".")) || undefined,
                    };
                    setSmokingPhases(next);
                  }}
                  placeholder="Minuten"
                />
                <button
                  type="button"
                  className={`${dangerButtonClassName} sm:col-span-3`}
                  onClick={() =>
                    setSmokingPhases((prev) => prev.filter((_, i) => i !== index))
                  }
                >
                  Phase entfernen
                </button>
              </div>
            ))}
            <button
              type="button"
              className={secondaryButtonClassName}
              onClick={() =>
                setSmokingPhases((prev) => [...prev, { name: "" }])
              }
            >
              + Räucherphase
            </button>
            <div>
              <label className={labelClassName}>Notizen</label>
              <textarea
                rows={2}
                className={`${inputClassName} mt-2 resize-y`}
                value={smokingNotes}
                onChange={(e) => setSmokingNotes(e.target.value)}
              />
            </div>
          </div>
        );

      case "zusammenfassung":
        return (
          <div className="space-y-5">
            <div className={sectionCardClassName}>
              <h4 className="font-display font-bold text-aw-cream">{name || "—"}</h4>
              <p className="mt-2 text-sm text-aw-muted">
                {category || "Keine Kategorie"} · {meats.length} Fleischzeile(n) ·{" "}
                {ingredients.length} Zutat(en)
              </p>
              {description && (
                <p className="mt-3 text-sm text-aw-cream">{description}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="summary-status" className={labelClassName}>
                  Status
                </label>
                <select
                  id="summary-status"
                  className={`${selectClassName} mt-2`}
                  value={status}
                  onChange={(e) =>
                    void handleStatusChange(e.target.value as RecipeStatus)
                  }
                  disabled={saving}
                >
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="summary-visibility" className={labelClassName}>
                  Sichtbarkeit
                </label>
                <select
                  id="summary-visibility"
                  className={`${selectClassName} mt-2`}
                  value={visibility}
                  onChange={(e) =>
                    void handleVisibilityChange(
                      e.target.value as RecipeVisibility,
                    )
                  }
                  disabled={saving}
                >
                  {Object.entries(VISIBILITY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {showDatabaseFlags && (
              <div className="mt-6 rounded-xl border border-aw-border bg-aw-surface/40 p-4">
                <h4 className="font-semibold text-aw-cream">Rezeptdatenbank-Flags</h4>
                <div className="mt-4 space-y-3 text-sm text-aw-muted">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isRecipeOfMonth}
                      onChange={(e) => setIsRecipeOfMonth(e.target.checked)}
                    />
                    Rezept des Monats
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isCourseLinked}
                      onChange={(e) => setIsCourseLinked(e.target.checked)}
                    />
                    Kurszugehörig (erst nach Kursbuchung freigeben)
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isMeisterclubSpecial}
                      onChange={(e) => setIsMeisterclubSpecial(e.target.checked)}
                    />
                    Meisterclub-Spezialrezept
                  </label>
                </div>
              </div>
            )}

            <RecipePlausibilityList
              issues={plausibilityResult.issues}
              showTitle
            />

            <div className="flex flex-wrap gap-3">
              {recipeId && !adminMode && (
                <RecipePdfExportButton recipeId={recipeId} />
              )}
              {recipeId && !adminMode && status === RecipeStatus.saved && (
                <ShareButton
                  label="Rezept teilen"
                  mode="recipe"
                  recipeId={recipeId}
                  title={name.trim() || "Mein Rezept"}
                />
              )}
              {recipeId && !adminMode && (
                <RecipeJsonExportButton recipeId={recipeId} />
              )}
              <button
                type="button"
                className={secondaryButtonClassName}
                disabled={saving}
                onClick={() => void persistRecipe(RecipeStatus.draft)}
              >
                Entwurf speichern
              </button>
              <button
                type="button"
                className={primaryButtonClassName}
                disabled={saving || (!adminMode && plausibilityResult.hasBlocking)}
                title={
                  !adminMode && plausibilityResult.hasBlocking
                    ? "Bitte zuerst die blockierenden Hinweise in der Prüfliste beheben."
                    : undefined
                }
                onClick={() => void persistRecipe(RecipeStatus.saved)}
              >
                Rezept speichern
              </button>
            </div>
            {plausibilityResult.hasBlocking && (
              <p className="text-xs text-aw-muted">
                „Rezept speichern“ ist gesperrt, bis die markierten
                Pflicht-Hinweise behoben sind. „Entwurf speichern“ bleibt
                möglich.
              </p>
            )}
          </div>
        );

      default:
        return null;
    }
  }

  if (loading) {
    return (
      <p className="text-center text-sm text-aw-muted">Rezept wird geladen …</p>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-aw-gold/25 bg-gradient-to-b from-aw-surface to-aw-bg shadow-[0_24px_48px_-24px_rgba(0,0,0,0.5)]">
      <div className="flex items-center gap-4 border-b border-aw-border bg-aw-surface/80 px-6 py-5 sm:px-8">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-aw-gold/10 text-aw-gold ring-1 ring-aw-gold/30">
          <Icon name="recipe" className="h-6 w-6" />
        </span>
        <div>
          <h2 className="font-display text-lg font-bold text-aw-cream sm:text-xl">
            {adminMode
              ? "Rezept bearbeiten (Admin)"
              : recipeId
                ? "Rezept bearbeiten"
                : "Neues Rezept"}
          </h2>
          <p className="text-sm text-aw-muted">
            Schritt {stepIndex + 1} von {WIZARD_STEPS.length}: {currentStep.label}
          </p>
        </div>
      </div>

      {/* Schritt-Navigation */}
      <nav
        className="flex gap-1 overflow-x-auto border-b border-aw-border px-4 py-3 sm:px-6"
        aria-label="Wizard-Schritte"
      >
        {WIZARD_STEPS.map((step, index) => (
          <button
            key={step.id}
            type="button"
            onClick={() => setStepIndex(index)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              index === stepIndex
                ? "bg-aw-gold/20 text-aw-gold"
                : "text-aw-muted hover:text-aw-cream"
            }`}
          >
            {step.label}
          </button>
        ))}
      </nav>

      <div className="grid gap-8 px-6 py-8 lg:grid-cols-[1fr_280px] lg:px-8">
        <div>
          {error && (
            <p
              className="mb-4 rounded-lg border border-aw-warning/40 bg-aw-warning/10 px-4 py-3 text-sm text-aw-warning"
              role="alert"
            >
              {error}
            </p>
          )}
          {success && (
            <p
              className="mb-4 rounded-lg border border-aw-success/40 bg-aw-success/10 px-4 py-3 text-sm text-aw-success"
              role="status"
            >
              {success}
            </p>
          )}

          <h3 className="font-display text-xl font-bold text-aw-cream">
            {currentStep.label}
          </h3>
          <div className="mt-6">{renderStepContent(currentStep.id)}</div>

          <div className="mt-8 flex flex-wrap justify-between gap-3 border-t border-aw-border pt-6">
            <button
              type="button"
              className={secondaryButtonClassName}
              disabled={stepIndex === 0}
              onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
            >
              Zurück
            </button>
            {stepIndex < WIZARD_STEPS.length - 1 ? (
              <button
                type="button"
                className={primaryButtonClassName}
                onClick={() =>
                  setStepIndex((i) =>
                    Math.min(WIZARD_STEPS.length - 1, i + 1),
                  )
                }
              >
                Weiter
              </button>
            ) : (
              <Link
                href="/werkstatt/rezeptgenerator"
                className={secondaryButtonClassName}
              >
                Zur Übersicht
              </Link>
            )}
          </div>
        </div>

        <RecipeLiveSummary {...plausibilityContext} />
      </div>
    </div>
  );
}
