"use client";

/**
 * @file AdminGeneratorSettings.tsx
 * @purpose Globale PDF-Einstellungen und Kategorieverwaltung.
 */

import { useEffect, useState } from "react";

import {
  createAdminCategoryApi,
  deleteAdminCategoryApi,
  fetchAdminCategories,
  fetchAdminRecipeSettings,
  updateAdminCategoryApi,
  updateAdminRecipeSettingsApi,
} from "@/lib/admin/admin-client";
import type { RecipeCategoryRecord } from "@/lib/admin/admin-category-service";
import type { RecipeGeneratorSettingsRecord } from "@/lib/admin/admin-settings-service";

const inputClassName =
  "w-full rounded-lg border border-aw-border bg-aw-bg px-3 py-2 text-sm text-aw-cream";

export default function AdminGeneratorSettings() {
  const [settings, setSettings] = useState<RecipeGeneratorSettingsRecord | null>(
    null,
  );
  const [categories, setCategories] = useState<RecipeCategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [newCategoryName, setNewCategoryName] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadEffect() {
      setLoading(true);
      setError(null);

      const [settingsRes, categoriesRes] = await Promise.all([
        fetchAdminRecipeSettings(),
        fetchAdminCategories(),
      ]);

      if (cancelled) {
        return;
      }

      if (!settingsRes.success) {
        setError(settingsRes.error.message);
      } else {
        setSettings(settingsRes.data);
      }

      if (!categoriesRes.success) {
        setError(categoriesRes.error.message);
      } else {
        setCategories(categoriesRes.data);
      }

      setLoading(false);
    }

    void loadEffect();

    return () => {
      cancelled = true;
    };
  }, []);

  async function saveSettings() {
    if (!settings) {
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    const response = await updateAdminRecipeSettingsApi({
      pdfHeaderText: settings.pdfHeaderText,
      pdfFooterText: settings.pdfFooterText,
      pdfLogoPlaceholder: settings.pdfLogoPlaceholder,
      pdfLegalNotice: settings.pdfLegalNotice,
    });

    setSaving(false);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setSettings(response.data);
    setSuccess("PDF-Einstellungen gespeichert.");
  }

  async function addCategory() {
    const name = newCategoryName.trim();

    if (!name) {
      setError("Bitte einen Kategorienamen eingeben.");
      return;
    }

    setSaving(true);
    setError(null);

    const response = await createAdminCategoryApi({ name });

    setSaving(false);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setNewCategoryName("");
    setCategories((prev) => [...prev, response.data].sort((a, b) => a.sortOrder - b.sortOrder));
    setSuccess(`Kategorie „${response.data.name}“ angelegt.`);
  }

  async function toggleCategoryActive(category: RecipeCategoryRecord) {
    const response = await updateAdminCategoryApi(category.id, {
      active: !category.active,
    });

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setCategories((prev) =>
      prev.map((item) => (item.id === category.id ? response.data : item)),
    );
  }

  async function removeCategory(id: string, name: string) {
    if (!window.confirm(`Kategorie „${name}“ wirklich löschen?`)) {
      return;
    }

    const response = await deleteAdminCategoryApi(id);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setCategories((prev) => prev.filter((item) => item.id !== id));
    setSuccess(`Kategorie „${name}“ gelöscht.`);
  }

  if (loading) {
    return (
      <p className="p-8 text-sm text-aw-muted">Einstellungen werden geladen …</p>
    );
  }

  return (
    <div className="p-6 sm:p-8">
      <h1 className="font-display text-2xl font-bold text-aw-cream">
        Generator-Einstellungen
      </h1>
      <p className="mt-2 text-sm text-aw-muted">
        PDF-Layout und verwaltete Wurstkategorien.
      </p>

      {error && (
        <p
          className="mt-4 rounded-lg border border-aw-warning/40 bg-aw-warning/10 px-4 py-3 text-sm text-aw-warning"
          role="alert"
        >
          {error}
        </p>
      )}
      {success && (
        <p className="mt-4 rounded-lg border border-aw-success/30 bg-aw-success/10 px-4 py-3 text-sm text-aw-success">
          {success}
        </p>
      )}

      {settings && (
        <section className="mt-8 rounded-xl border border-aw-border bg-aw-surface/60 p-5">
          <h2 className="font-display text-lg font-bold text-aw-gold">
            PDF-Einstellungen
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-aw-cream">
                Headertext
              </label>
              <input
                className={`${inputClassName} mt-2`}
                value={settings.pdfHeaderText}
                onChange={(e) =>
                  setSettings({ ...settings, pdfHeaderText: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-aw-cream">
                Logo-Platzhalter
              </label>
              <input
                className={`${inputClassName} mt-2`}
                value={settings.pdfLogoPlaceholder}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    pdfLogoPlaceholder: e.target.value,
                  })
                }
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-semibold text-aw-cream">
                Footertext
              </label>
              <input
                className={`${inputClassName} mt-2`}
                value={settings.pdfFooterText}
                onChange={(e) =>
                  setSettings({ ...settings, pdfFooterText: e.target.value })
                }
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-semibold text-aw-cream">
                Rechtshinweis
              </label>
              <textarea
                rows={3}
                className={`${inputClassName} mt-2 resize-y`}
                value={settings.pdfLegalNotice}
                onChange={(e) =>
                  setSettings({ ...settings, pdfLegalNotice: e.target.value })
                }
              />
            </div>
          </div>
          <button
            type="button"
            disabled={saving}
            className="mt-4 rounded-lg bg-aw-gold px-5 py-2.5 text-sm font-semibold text-aw-bg hover:bg-aw-cream disabled:opacity-50"
            onClick={() => void saveSettings()}
          >
            PDF-Einstellungen speichern
          </button>
        </section>
      )}

      <section className="mt-8 rounded-xl border border-aw-border bg-aw-surface/60 p-5">
        <h2 className="font-display text-lg font-bold text-aw-gold">
          Kategorien
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <input
            className={`${inputClassName} max-w-xs`}
            placeholder="Neue Kategorie"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
          />
          <button
            type="button"
            disabled={saving}
            className="rounded-lg border border-aw-border px-4 py-2 text-sm font-semibold text-aw-cream hover:border-aw-gold/50"
            onClick={() => void addCategory()}
          >
            Hinzufügen
          </button>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-aw-border text-xs uppercase text-aw-muted">
                <th className="pb-2 pr-4">Name</th>
                <th className="pb-2 pr-4">Slug</th>
                <th className="pb-2 pr-4">Aktiv</th>
                <th className="pb-2 text-right">Aktion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-aw-border">
              {categories.map((category) => (
                <tr key={category.id}>
                  <td className="py-3 pr-4 font-medium text-aw-cream">
                    {category.name}
                  </td>
                  <td className="py-3 pr-4 text-aw-muted">{category.slug}</td>
                  <td className="py-3 pr-4">
                    <button
                      type="button"
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        category.active
                          ? "bg-aw-success/20 text-aw-success"
                          : "bg-aw-muted/20 text-aw-muted"
                      }`}
                      onClick={() => void toggleCategoryActive(category)}
                    >
                      {category.active ? "Aktiv" : "Inaktiv"}
                    </button>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      type="button"
                      className="text-sm text-aw-warning hover:underline"
                      onClick={() =>
                        void removeCategory(category.id, category.name)
                      }
                    >
                      Löschen
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
