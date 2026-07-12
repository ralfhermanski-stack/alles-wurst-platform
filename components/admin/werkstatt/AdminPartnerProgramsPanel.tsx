"use client";

import { useEffect, useState } from "react";

import { adminFetch } from "@/lib/admin/admin-fetch";
import type {
  PartnerProgramEntry,
  ProductRecommendationSettingsEntry,
  UpsertPartnerProgramInput,
} from "@/lib/product-recommendations/product-recommendation-types";
import {
  inputClassName,
  labelClassName,
  primaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

const textareaClassName = `${inputClassName} min-h-[88px] resize-y`;

export default function AdminPartnerProgramsPanel() {
  const [programs, setPrograms] = useState<PartnerProgramEntry[]>([]);
  const [settings, setSettings] = useState<ProductRecommendationSettingsEntry | null>(null);
  const [disclosure, setDisclosure] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<UpsertPartnerProgramInput>({
    name: "",
    programType: "amazon",
    affiliateId: "",
    urlTemplate: "https://www.amazon.de/dp/{asin}?tag={tag}",
  });

  async function reload() {
    const response = await adminFetch<{ programs: PartnerProgramEntry[]; settings: ProductRecommendationSettingsEntry }>(
      "/api/admin/einstellungen/partnerprogramme",
    );
    setLoading(false);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setPrograms(response.data.programs);
    setSettings(response.data.settings);
    setDisclosure(response.data.settings.affiliateDisclosureText);
  }

  useEffect(() => {
    void reload();
  }, []);

  async function handleSaveProgram() {
    const response = await adminFetch("/api/admin/einstellungen/partnerprogramme", {
      method: "POST",
      body: JSON.stringify(form),
    });

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setForm({
      name: "",
      programType: "amazon",
      affiliateId: "",
      urlTemplate: "https://www.amazon.de/dp/{asin}?tag={tag}",
    });
    await reload();
  }

  async function handleSaveDisclosure() {
    const response = await adminFetch<ProductRecommendationSettingsEntry>(
      "/api/admin/einstellungen/partnerprogramme",
      {
        method: "PATCH",
        body: JSON.stringify({ affiliateDisclosureText: disclosure }),
      },
    );

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setSettings(response.data);
  }

  if (loading) {
    return <p className="text-sm text-aw-muted">Partnerprogramme werden geladen …</p>;
  }

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-aw-border p-4">
        <h2 className="mb-3 font-semibold text-aw-cream">Affiliate-Hinweis (DSGVO)</h2>
        <label className={labelClassName}>Zentraler Hinweistext</label>
        <textarea
          className={textareaClassName}
          rows={3}
          value={disclosure}
          onChange={(e) => setDisclosure(e.target.value)}
        />
        <button
          type="button"
          className={`${primaryButtonClassName} mt-3`}
          onClick={() => void handleSaveDisclosure()}
        >
          Hinweis speichern
        </button>
        {settings && (
          <p className="mt-2 text-xs text-aw-muted">
            Aktuell gespeichert. Wird auf allen Produktseiten angezeigt.
          </p>
        )}
      </section>

      <section className="rounded-xl border border-aw-border p-4">
        <h2 className="mb-3 font-semibold text-aw-cream">Neues Partnerprogramm</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className={labelClassName}>Name</label>
            <input
              className={inputClassName}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClassName}>Typ</label>
            <select
              className={inputClassName}
              value={form.programType}
              onChange={(e) =>
                setForm({
                  ...form,
                  programType: e.target.value as UpsertPartnerProgramInput["programType"],
                })
              }
            >
              <option value="amazon">Amazon</option>
              <option value="awin">Awin</option>
              <option value="digistore24">Digistore24</option>
              <option value="own_shop">Eigener Shop</option>
              <option value="external">Extern</option>
              <option value="course">Eigener Kurs</option>
            </select>
          </div>
          <div>
            <label className={labelClassName}>Affiliate-ID / Tag</label>
            <input
              className={inputClassName}
              value={form.affiliateId ?? ""}
              onChange={(e) => setForm({ ...form, affiliateId: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClassName}>URL-Vorlage</label>
            <input
              className={inputClassName}
              value={form.urlTemplate ?? ""}
              onChange={(e) => setForm({ ...form, urlTemplate: e.target.value })}
            />
          </div>
        </div>
        <button
          type="button"
          className={`${primaryButtonClassName} mt-3`}
          onClick={() => void handleSaveProgram()}
        >
          Partnerprogramm anlegen
        </button>
      </section>

      <section className="rounded-xl border border-aw-border p-4">
        <h2 className="mb-3 font-semibold text-aw-cream">Vorhandene Programme</h2>
        <ul className="space-y-2 text-sm text-aw-muted">
          {programs.map((program) => (
            <li key={program.id} className="rounded-lg border border-aw-border/60 p-3">
              <p className="font-semibold text-aw-cream">{program.name}</p>
              <p>
                {program.programType} · {program.affiliateId ?? "—"} ·{" "}
                {program.isActive ? "aktiv" : "inaktiv"}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {error && (
        <p className="text-sm text-aw-warning" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
