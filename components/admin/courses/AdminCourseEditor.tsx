"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  archiveCourseApi,
  createAdminCourseApi,
  getAdminCourseApi,
  getCourseValidationApi,
  publishCourseApi,
  regenerateSalesProductApi,
  updateAdminCourseApi,
  uploadCourseCoverApi,
} from "@/lib/courses/admin-course-client";
import {
  listCourseGroupsApi,
  listCourseSubgroupsApi,
} from "@/lib/course-groups/course-group-admin-client";
import type {
  CourseGroupRecord,
  CourseSubgroupRecord,
} from "@/lib/course-groups/course-group-types";
import {
  COURSE_STATUS_LABELS,
  COURSE_TYPE_LABELS,
} from "@/lib/courses/course-labels";
import type { AdminCourseRecord } from "@/lib/courses/course-types";
import type { CourseValidationIssue } from "@/lib/courses/course-validation";
import {
  inputClassName,
  labelClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  selectClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";
import MarkdownField from "@/components/admin/MarkdownField";
import AdminCourseModulesPanel from "@/components/admin/courses/AdminCourseModulesPanel";
import AdminCourseProductPicker from "@/components/admin/courses/AdminCourseProductPicker";

type LearningPathDraft = {
  key: string;
  courseGroupId: string;
  courseSubgroupId: string;
  isPrimary: boolean;
};

function createLearningPathDraft(
  partial?: Partial<LearningPathDraft>,
): LearningPathDraft {
  return {
    key: crypto.randomUUID(),
    courseGroupId: "",
    courseSubgroupId: "",
    isPrimary: false,
    ...partial,
  };
}

function centsToEuroInput(cents: number | null): string {
  if (cents === null || cents === undefined) {
    return "";
  }

  return (cents / 100).toFixed(2).replace(".", ",");
}

function euroInputToCents(value: string): number | null {
  const trimmed = value.trim();

  if (trimmed === "") {
    return null;
  }

  const normalized = Number.parseFloat(trimmed.replace(/\./g, "").replace(",", "."));

  if (Number.isNaN(normalized) || normalized < 0) {
    return null;
  }

  return Math.round(normalized * 100);
}

type AdminCourseEditorProps = {
  courseId?: string;
};

const requiredMark = (
  <span className="text-aw-warning" aria-hidden="true">
    {" "}
    *
  </span>
);

function certificateOptionsForCourseType(
  courseType: "minikurs" | "zertifikatskurs",
  currentType: "none" | "participation" | "achievement" | "masterclass",
): Array<{ value: "none" | "participation" | "achievement"; label: string }> {
  const options: Array<{
    value: "none" | "participation" | "achievement";
    label: string;
  }> = [
    { value: "none", label: "Kein Nachweis" },
    { value: "participation", label: "Teilnahmeurkunde" },
  ];

  if (courseType === "zertifikatskurs" || currentType === "achievement") {
    options.push({ value: "achievement", label: "Zertifikat" });
  }

  return options;
}

export default function AdminCourseEditor({ courseId }: AdminCourseEditorProps) {
  const router = useRouter();
  const [course, setCourse] = useState<AdminCourseRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(courseId));

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [courseType, setCourseType] = useState<"minikurs" | "zertifikatskurs">(
    "minikurs",
  );
  const [status, setStatus] = useState<"draft" | "published" | "archived">(
    "draft",
  );
  const [certificateType, setCertificateType] = useState<
    "none" | "participation" | "achievement" | "masterclass"
  >("participation");
  const [certificateOverride, setCertificateOverride] = useState(false);
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [prerequisites, setPrerequisites] = useState("");
  const [requiredEquipment, setRequiredEquipment] = useState("");
  const [linkedProductIds, setLinkedProductIds] = useState<string[]>([]);
  const [priceInput, setPriceInput] = useState("");
  const [priceCurrency, setPriceCurrency] = useState("EUR");
  const [featuredOnHomepage, setFeaturedOnHomepage] = useState(false);
  const [homepageSortOrder, setHomepageSortOrder] = useState(100);
  const [forumsEnabled, setForumsEnabled] = useState(false);
  const [learningPathDrafts, setLearningPathDrafts] = useState<LearningPathDraft[]>(
    () => [createLearningPathDraft({ isPrimary: true })],
  );
  const [courseGroups, setCourseGroups] = useState<CourseGroupRecord[]>([]);
  const [courseSubgroups, setCourseSubgroups] = useState<CourseSubgroupRecord[]>(
    [],
  );
  const [salesProductLoading, setSalesProductLoading] = useState(false);

  const [validationIssues, setValidationIssues] = useState<CourseValidationIssue[]>(
    [],
  );
  const [actionLoading, setActionLoading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverVersion, setCoverVersion] = useState(0);

  async function handleCoverUpload(file: File) {
    if (!courseId) {
      return;
    }

    setCoverUploading(true);
    setError(null);

    const formData = new FormData();
    formData.set("file", file);

    const response = await uploadCourseCoverApi(courseId, formData);
    setCoverUploading(false);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setCourse(response.data);
    setCoverVersion((value) => value + 1);
  }

  async function refreshValidation(id: string) {
    const response = await getCourseValidationApi(id);

    if (response.success) {
      setValidationIssues(response.data);
    }
  }

  useEffect(() => {
    void (async () => {
      const [groupsResponse, subgroupsResponse] = await Promise.all([
        listCourseGroupsApi(),
        listCourseSubgroupsApi(),
      ]);

      if (groupsResponse.success) {
        setCourseGroups(groupsResponse.data);
      }

      if (subgroupsResponse.success) {
        setCourseSubgroups(subgroupsResponse.data);
      }
    })();
  }, []);

  function subgroupsForGroup(groupId: string, currentSubgroupId?: string) {
    return courseSubgroups.filter(
      (subgroup) =>
        subgroup.courseGroupId === groupId &&
        (subgroup.isActive || subgroup.id === currentSubgroupId),
    );
  }

  function updateLearningPathDraft(
    key: string,
    patch: Partial<LearningPathDraft>,
  ) {
    setLearningPathDrafts((current) =>
      current.map((draft) => (draft.key === key ? { ...draft, ...patch } : draft)),
    );
  }

  function handleLearningPathGroupChange(key: string, nextGroupId: string) {
    updateLearningPathDraft(key, {
      courseGroupId: nextGroupId,
      courseSubgroupId: "",
    });
  }

  function setPrimaryLearningPath(key: string) {
    setLearningPathDrafts((current) =>
      current.map((draft) => ({
        ...draft,
        isPrimary: draft.key === key,
      })),
    );
  }

  function addLearningPathDraft() {
    setLearningPathDrafts((current) => [
      ...current,
      createLearningPathDraft({ isPrimary: current.length === 0 }),
    ]);
  }

  function removeLearningPathDraft(key: string) {
    setLearningPathDrafts((current) => {
      if (current.length <= 1) {
        return current;
      }

      const next = current.filter((draft) => draft.key !== key);

      if (!next.some((draft) => draft.isPrimary)) {
        next[0] = { ...next[0], isPrimary: true };
      }

      return next;
    });
  }

  useEffect(() => {
    if (!courseId) {
      return;
    }

    void (async () => {
      const response = await getAdminCourseApi(courseId);
      setLoading(false);

      if (!response.success || !response.data) {
        setError(response.success ? "Kurs nicht gefunden." : response.error.message);
        return;
      }

      setCourse(response.data);
      setTitle(response.data.title);
      setSlug(response.data.slug);
      setCourseType(response.data.courseType);
      setStatus(response.data.status);
      setCertificateType(
        response.data.certificateType === "masterclass"
          ? "achievement"
          : response.data.certificateType,
      );
      setCertificateOverride(response.data.certificateOverride);
      setDescription(response.data.description ?? "");
      setShortDescription(response.data.shortDescription ?? "");
      setPrerequisites(response.data.prerequisites ?? "");
      setRequiredEquipment(response.data.requiredEquipment ?? "");
      setLinkedProductIds(response.data.linkedProductIds ?? []);
      setPriceInput(centsToEuroInput(response.data.priceCents));
      setPriceCurrency(response.data.priceCurrency ?? "EUR");
      setFeaturedOnHomepage(response.data.featuredOnHomepage);
      setHomepageSortOrder(response.data.homepageSortOrder);
      setForumsEnabled(response.data.forumsEnabled);
      if (response.data.learningPathAssignments.length > 0) {
        setLearningPathDrafts(
          response.data.learningPathAssignments.map((assignment) => ({
            key: assignment.id,
            courseGroupId: assignment.courseGroupId,
            courseSubgroupId: assignment.courseSubgroupId ?? "",
            isPrimary: assignment.isPrimary,
          })),
        );
      } else if (response.data.courseGroupId) {
        setLearningPathDrafts([
          createLearningPathDraft({
            key: "legacy",
            courseGroupId: response.data.courseGroupId,
            courseSubgroupId: response.data.courseSubgroupId ?? "",
            isPrimary: true,
          }),
        ]);
      } else {
        setLearningPathDrafts([createLearningPathDraft({ isPrimary: true })]);
      }
      void refreshValidation(courseId);
    })();
  }, [courseId]);

  async function reloadCourse(id: string) {
    const response = await getAdminCourseApi(id);

    if (response.success && response.data) {
      setCourse(response.data);
      setCertificateType(
        response.data.certificateType === "masterclass"
          ? "achievement"
          : response.data.certificateType,
      );
      setCertificateOverride(response.data.certificateOverride);
      void refreshValidation(id);
    }
  }

  async function reloadCourseForPanel() {
    if (!courseId) {
      return;
    }

    await reloadCourse(courseId);
  }

  async function handleSaveCourse() {
    setError(null);

    const payload = {
      title,
      slug,
      courseType,
      status,
      certificateType,
      certificateOverride: certificateType === "achievement" ? certificateOverride : false,
      description,
      shortDescription,
      prerequisites,
      requiredEquipment,
      linkedProductIds,
      priceCents: euroInputToCents(priceInput),
      priceCurrency,
      featuredOnHomepage,
      homepageSortOrder,
      forumsEnabled,
      learningPathAssignments: learningPathDrafts
        .filter((draft) => draft.courseGroupId)
        .map((draft, index) => ({
          courseGroupId: draft.courseGroupId,
          courseSubgroupId: draft.courseSubgroupId || null,
          isPrimary: draft.isPrimary,
          sortOrder: (index + 1) * 100,
        })),
    };

    const response = courseId
      ? await updateAdminCourseApi(courseId, payload)
      : await createAdminCourseApi(payload);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    if (!courseId) {
      router.push(`/admin/kurse/${response.data.id}`);
      return;
    }

    setCourse(response.data);
    if (response.data.learningPathAssignments.length > 0) {
      setLearningPathDrafts(
        response.data.learningPathAssignments.map((assignment) => ({
          key: assignment.id,
          courseGroupId: assignment.courseGroupId,
          courseSubgroupId: assignment.courseSubgroupId ?? "",
          isPrimary: assignment.isPrimary,
        })),
      );
    }
    setLinkedProductIds(response.data.linkedProductIds ?? []);
    void refreshValidation(courseId);
  }

  async function handlePublish() {
    if (!courseId) {
      return;
    }

    setActionLoading(true);
    setError(null);

    const response = await publishCourseApi(courseId);
    setActionLoading(false);

    if (!response.success) {
      setError(response.error.message);
      void refreshValidation(courseId);
      return;
    }

    setCourse(response.data);
    setStatus(response.data.status);
    void refreshValidation(courseId);
  }

  async function handleArchive() {
    if (!courseId) {
      return;
    }

    setActionLoading(true);
    setError(null);

    const response = await archiveCourseApi(courseId);
    setActionLoading(false);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setCourse(response.data);
    setStatus(response.data.status);
  }

  async function handleRegenerateSalesProduct() {
    if (!courseId) {
      return;
    }

    setSalesProductLoading(true);
    setError(null);

    const response = await regenerateSalesProductApi(courseId);
    setSalesProductLoading(false);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setCourse(response.data);
    void refreshValidation(courseId);
  }

  if (loading) {
    return <p className="p-8 text-sm text-aw-muted">Kurs wird geladen …</p>;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-aw-cream">
            {courseId ? "Kurs bearbeiten" : "Neuen Kurs anlegen"}
          </h1>
          <p className="mt-1 text-xs text-aw-muted">
            Pflichtfelder sind mit * markiert.
          </p>
        </div>

        {courseId && (
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/admin/kurse/${courseId}/vorschau`}
              className={secondaryButtonClassName}
            >
              Vorschau
            </Link>
            {status !== "published" && (
              <button
                type="button"
                className={primaryButtonClassName}
                disabled={actionLoading}
                onClick={() => void handlePublish()}
              >
                Veröffentlichen
              </button>
            )}
            {status !== "archived" && (
              <button
                type="button"
                className={secondaryButtonClassName}
                disabled={actionLoading}
                onClick={() => void handleArchive()}
              >
                Archivieren
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-aw-warning" role="alert">
          {error}
        </p>
      )}

      {courseId && validationIssues.length > 0 && (
        <section
          className="rounded-xl border border-aw-warning/40 bg-aw-warning/5 p-4"
          role="status"
        >
          <h2 className="text-sm font-semibold text-aw-warning">
            Veröffentlichung noch nicht möglich
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-aw-muted">
            {validationIssues.map((issue) => (
              <li key={`${issue.path}-${issue.message}`}>{issue.message}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-xl border border-aw-border bg-aw-surface/40 p-5">
        <h2 className="font-semibold text-aw-cream">Stammdaten</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClassName} htmlFor="course-title">
              Titel{requiredMark}
            </label>
            <input
              id="course-title"
              className={`${inputClassName} mt-2`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClassName} htmlFor="course-slug">
              Slug
            </label>
            <input
              id="course-slug"
              className={`${inputClassName} mt-2`}
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClassName} htmlFor="course-type">
              Kurstyp{requiredMark}
            </label>
            <select
              id="course-type"
              className={`${selectClassName} mt-2`}
              value={courseType}
              onChange={(e) =>
                setCourseType(e.target.value as "minikurs" | "zertifikatskurs")
              }
            >
              {Object.entries(COURSE_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClassName} htmlFor="course-status">
              Status
            </label>
            <select
              id="course-status"
              className={`${selectClassName} mt-2`}
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "draft" | "published" | "archived")
              }
            >
              {Object.entries(COURSE_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <label className={labelClassName}>
                Gruppen
              </label>
              <button
                type="button"
                className={`${secondaryButtonClassName} text-xs`}
                onClick={addLearningPathDraft}
              >
                Gruppe hinzufügen
              </button>
            </div>
            <p className="mt-1 text-xs text-aw-muted">
              Ein Kurs kann einer oder mehreren Gruppen zugeordnet werden. Die
              primäre Gruppe steuert die Hauptkategorie im Katalog.
            </p>
            <div className="mt-3 space-y-3">
              {learningPathDrafts.map((draft, index) => {
                const usedGroupIds = new Set(
                  learningPathDrafts
                    .filter((entry) => entry.key !== draft.key && entry.courseGroupId)
                    .map((entry) => entry.courseGroupId),
                );
                const selectableGroups = courseGroups.filter(
                  (group) =>
                    group.id === draft.courseGroupId ||
                    (!usedGroupIds.has(group.id) &&
                      (group.isActive || group.id === draft.courseGroupId)),
                );
                const selectableSubgroups = draft.courseGroupId
                  ? subgroupsForGroup(draft.courseGroupId, draft.courseSubgroupId)
                  : [];

                return (
                  <div
                    key={draft.key}
                    className="rounded-xl border border-aw-border bg-aw-surface-2/40 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-aw-cream">
                        Gruppe {index + 1}
                      </p>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-xs text-aw-muted">
                          <input
                            type="radio"
                            name="primary-learning-path"
                            checked={draft.isPrimary}
                            onChange={() => setPrimaryLearningPath(draft.key)}
                          />
                          Primär
                        </label>
                        {learningPathDrafts.length > 1 && (
                          <button
                            type="button"
                            className="text-xs text-aw-muted transition-colors hover:text-red-400"
                            onClick={() => removeLearningPathDraft(draft.key)}
                          >
                            Entfernen
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label
                          className="text-xs font-medium text-aw-muted"
                          htmlFor={`learning-path-group-${draft.key}`}
                        >
                          Gruppe
                        </label>
                        <select
                          id={`learning-path-group-${draft.key}`}
                          className={`${selectClassName} mt-1`}
                          value={draft.courseGroupId}
                          onChange={(e) =>
                            handleLearningPathGroupChange(draft.key, e.target.value)
                          }
                        >
                          <option value="">— Bitte wählen —</option>
                          {selectableGroups.map((group) => (
                            <option key={group.id} value={group.id}>
                              {group.name}
                              {!group.isActive ? " (inaktiv)" : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label
                          className="text-xs font-medium text-aw-muted"
                          htmlFor={`learning-path-subgroup-${draft.key}`}
                        >
                          Modul (optional)
                        </label>
                        <select
                          id={`learning-path-subgroup-${draft.key}`}
                          className={`${selectClassName} mt-1`}
                          value={draft.courseSubgroupId}
                          disabled={!draft.courseGroupId}
                          onChange={(e) =>
                            updateLearningPathDraft(draft.key, {
                              courseSubgroupId: e.target.value,
                            })
                          }
                        >
                          <option value="">— Keines —</option>
                          {selectableSubgroups.map((subgroup) => (
                            <option key={subgroup.id} value={subgroup.id}>
                              {subgroup.name}
                              {!subgroup.isActive ? " (inaktiv)" : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-aw-muted">
              Gruppen werden unter{" "}
              <Link href="/admin/kurse/gruppen" className="text-aw-gold hover:underline">
                Gruppen
              </Link>{" "}
              verwaltet.
            </p>
          </div>
          <div>
            <label className={labelClassName} htmlFor="certificate-type">
              Abschlussnachweis
            </label>
            <select
              id="certificate-type"
              className={`${selectClassName} mt-2`}
              value={
                certificateType === "masterclass" ? "achievement" : certificateType
              }
              onChange={(e) => {
                const value = e.target.value as
                  | "none"
                  | "participation"
                  | "achievement";

                setCertificateType(value);

                if (courseType === "minikurs" && value === "achievement") {
                  setCertificateOverride(true);
                } else if (value !== "achievement") {
                  setCertificateOverride(false);
                }
              }}
            >
              {certificateOptionsForCourseType(courseType, certificateType).map(
                (option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ),
              )}
            </select>
            <p className="mt-1 text-xs text-aw-muted">
              {courseType === "minikurs"
                ? "Minikurs: „Kein Nachweis“ oder „Teilnahmeurkunde“."
                : "Zertifikatskurs: alle Nachweisarten verfügbar."}
            </p>
            {courseType === "minikurs" && certificateType === "achievement" && (
              <p className="mt-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                Für Minikurse wird normalerweise eine Teilnahmeurkunde empfohlen.
              </p>
            )}
            {courseType === "minikurs" &&
              certificateType !== "achievement" &&
              certificateOverride && (
                <button
                  type="button"
                  className="mt-2 text-xs text-aw-gold underline"
                  onClick={() => {
                    setCertificateType("achievement");
                    setCertificateOverride(true);
                  }}
                >
                  Zertifikat für diesen Minikurs aktivieren
                </button>
              )}
          </div>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClassName} htmlFor="course-price">
              Preis (in Euro)
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id="course-price"
                className={inputClassName}
                inputMode="decimal"
                placeholder="z. B. 149,00 (0 = kostenlos)"
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
              />
              <input
                aria-label="Währung"
                className={`${inputClassName} w-24`}
                value={priceCurrency}
                onChange={(e) => setPriceCurrency(e.target.value.toUpperCase())}
              />
            </div>
            <p className="mt-1 text-xs text-aw-muted">
              Leer = kein Preis gesetzt. „0“ bedeutet bewusst kostenlos.
            </p>
          </div>
          <div>
            <label className={labelClassName} htmlFor="course-homepage-order">
              Startseiten-Sortierung
            </label>
            <input
              id="course-homepage-order"
              type="number"
              className={`${inputClassName} mt-2`}
              value={homepageSortOrder}
              onChange={(e) =>
                setHomepageSortOrder(Number.parseInt(e.target.value, 10) || 0)
              }
            />
            <label className="mt-3 flex items-center gap-2 text-sm text-aw-cream">
              <input
                type="checkbox"
                className="h-4 w-4 accent-aw-gold"
                checked={featuredOnHomepage}
                onChange={(e) => setFeaturedOnHomepage(e.target.checked)}
              />
              Auf Startseite hervorheben
            </label>
          </div>
        </div>

        <div className="mt-4">
          <span className={labelClassName}>Verkaufsstatus</span>
          <p className="mt-1 text-xs text-aw-muted">
            Zu jedem Kurs wird automatisch ein Verkaufsprodukt gepflegt. Preis- und
            Titeländerungen werden beim Speichern übernommen.
          </p>

          {!courseId ? (
            <div className="mt-2 rounded-lg border border-aw-border bg-aw-charcoal/40 px-4 py-3 text-sm text-aw-muted">
              Das Verkaufsprodukt wird automatisch erzeugt, sobald der Kurs
              gespeichert wird.
            </div>
          ) : course?.salesProduct.exists &&
            course.salesProduct.active ? (
            <div className="mt-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3">
              <p className="text-sm font-medium text-emerald-300">
                ✓ Verkaufsprodukt vorhanden
              </p>
              <p className="mt-1 text-xs text-aw-muted">
                {course.salesProduct.hasActivePrice
                  ? "Kostenpflichtiger Verkauf aktiv."
                  : "Kostenloser Kurs – kein Preis hinterlegt."}
                {course.salesProduct.productSlug ? (
                  <>
                    {" "}
                    Checkout-URL:{" "}
                    <span className="text-aw-gold">
                      /kaufen/{course.salesProduct.productSlug}
                    </span>
                  </>
                ) : null}
              </p>
            </div>
          ) : (
            <div className="mt-2 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3">
              <p className="text-sm font-medium text-red-300">
                ✗ Verkaufsprodukt fehlt
              </p>
              <p className="mt-1 text-xs text-aw-muted">
                Für diesen Kurs ist derzeit kein aktives Verkaufsprodukt hinterlegt.
              </p>
              <button
                type="button"
                className={`${secondaryButtonClassName} mt-3`}
                onClick={handleRegenerateSalesProduct}
                disabled={salesProductLoading}
              >
                {salesProductLoading
                  ? "Wird erzeugt …"
                  : "Verkaufsprodukt neu erzeugen"}
              </button>
            </div>
          )}
        </div>

        {courseId && course?.reviewStats && (
          <div className="mt-4 rounded-lg border border-aw-border bg-aw-charcoal/40 px-4 py-3">
            <p className="text-sm font-medium text-aw-cream">Bewertungen</p>
            <p className="mt-1 text-xs text-aw-muted">
              Durchschnitt:{" "}
              {course.reviewStats.averageRating !== null
                ? `${course.reviewStats.averageRating.toFixed(1).replace(".", ",")} ★`
                : "—"}{" "}
              · {course.reviewStats.reviewCount} freigegeben ·{" "}
              {course.reviewStats.pendingCount} ausstehend
            </p>
          </div>
        )}

        <div className="mt-4 rounded-lg border border-aw-border bg-aw-charcoal/40 px-4 py-3">
          <label className="flex items-center gap-3 text-sm text-aw-cream">
            <input
              type="checkbox"
              className="h-4 w-4 accent-aw-gold"
              checked={forumsEnabled}
              onChange={(e) => setForumsEnabled(e.target.checked)}
            />
            Foren für diesen Kurs aktivieren
          </label>
          <p className="mt-2 text-xs text-aw-muted">
            Beim Speichern oder Veröffentlichen werden automatisch Vorstellungs-,
            Fragen- und Verbesserungsforen erzeugt (ohne Duplikate).
          </p>
        </div>

        <div className="mt-4">
          <label className={labelClassName} htmlFor="course-short-description">
            Kurzbeschreibung
          </label>
          <p className="mt-1 text-xs text-aw-muted">
            Kurzer Text für Kurskarten und Katalog (ohne Formatierung).
          </p>
          <textarea
            id="course-short-description"
            className={`${inputClassName} mt-2 min-h-20`}
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
          />
        </div>

        <div className="mt-4">
          <MarkdownField
            id="course-description"
            label="Beschreibung"
            value={description}
            onChange={setDescription}
            helpText="Ausführliche Kursbeschreibung. Markdown wird sicher gerendert."
          />
        </div>

        <div className="mt-4">
          <MarkdownField
            id="course-prerequisites"
            label="Voraussetzungen"
            value={prerequisites}
            onChange={setPrerequisites}
            helpText="Was Teilnehmer mitbringen sollten (Vorkenntnisse …)."
          />
        </div>

        <div className="mt-4">
          <MarkdownField
            id="course-required-equipment"
            label="Was du zuhause benötigst"
            value={requiredEquipment}
            onChange={setRequiredEquipment}
            helpText="Benötigte Ausrüstung, Zutaten oder Werkzeuge (Freitext)."
          />
        </div>

        {courseId && (
          <div className="mt-4">
            <AdminCourseProductPicker
              selectedProductIds={linkedProductIds}
              onChange={setLinkedProductIds}
            />
          </div>
        )}

        {courseId && (
          <div className="mt-4">
            <label className={labelClassName}>Coverbild</label>
            <p className="mt-1 text-xs text-aw-muted">
              Titelbild des Kurses (JPG, PNG oder WebP). Wird im Katalog angezeigt.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              {course?.hasCover && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/courses/covers/${courseId}?v=${coverVersion}`}
                  alt="Kurs-Cover"
                  className="h-24 w-40 rounded-lg border border-aw-border object-cover"
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
                      void handleCoverUpload(file);
                    }
                  }}
                />
                {coverUploading && (
                  <p className="mt-2 text-xs text-aw-muted">Bild wird hochgeladen …</p>
                )}
                {course?.coverFileName && (
                  <p className="mt-2 text-xs text-aw-muted">
                    Aktuell: {course.coverFileName}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          className={`${primaryButtonClassName} mt-4`}
          onClick={() => void handleSaveCourse()}
        >
          Kurs speichern
        </button>
      </section>

      {courseId && course && (
        <AdminCourseModulesPanel
          courseId={courseId}
          course={course}
          onReload={reloadCourseForPanel}
          onError={setError}
        />
      )}
    </div>
  );
}
