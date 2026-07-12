"use client";

/**
 * @file AdminPlatformTextPanel.tsx
 * @purpose Zentrale Textverwaltung mit Suche, Kategorien, Vorschau und Import/Export.
 */

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  exportPlatformTextsApi,
  fetchHardcodedTextReport,
  fetchPlatformTextChangeLogs,
  fetchPlatformTexts,
  fetchPlatformTextVersions,
  importPlatformTextsApi,
  resetPlatformTextApi,
  updatePlatformTextApi,
} from "@/lib/platform-text/platform-text-client";
import { PLATFORM_TEXT_CATEGORIES } from "@/lib/platform-text/platform-text-types";
import type {
  PlatformTextChangeLogRecord,
  PlatformTextRecord,
  PlatformTextVersionRecord,
} from "@/lib/platform-text/platform-text-types";
import {
  inputClassName,
  labelClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

const selectClassName =
  "w-full rounded-lg border border-aw-border bg-aw-bg px-3 py-2 text-sm text-aw-cream";

export default function AdminPlatformTextPanel() {
  const [texts, setTexts] = useState<PlatformTextRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [changeNote, setChangeNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [versions, setVersions] = useState<PlatformTextVersionRecord[]>([]);
  const [changelog, setChangelog] = useState<PlatformTextChangeLogRecord[]>([]);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [report, setReport] = useState<{
    totalFindings: number;
    managedKeys: number;
    findings: Array<{
      file: string;
      line: number;
      text: string;
      managed: boolean;
      suggestedKey?: string;
    }>;
  } | null>(null);

  const selected = useMemo(
    () => texts.find((row) => row.key === selectedKey) ?? null,
    [texts, selectedKey],
  );

  const loadTexts = useCallback(async () => {
    setLoading(true);
    setError(null);

    const response = await fetchPlatformTexts({
      category: category || undefined,
      search: search || undefined,
    });

    if (!response.success) {
      setError(response.error.message);
      setTexts([]);
    } else {
      setTexts(response.data);
    }

    setLoading(false);
  }, [category, search]);

  useEffect(() => {
    void loadTexts();
  }, [loadTexts]);

  useEffect(() => {
    if (!selected) {
      setEditValue("");
      setVersions([]);
      setChangelog([]);
      return;
    }

    setEditValue(selected.value);

    void (async () => {
      const [versionsRes, changelogRes] = await Promise.all([
        fetchPlatformTextVersions(selected.key),
        fetchPlatformTextChangeLogs(selected.key),
      ]);

      if (versionsRes.success) {
        setVersions(versionsRes.data);
      }

      if (changelogRes.success) {
        setChangelog(changelogRes.data);
      }
    })();
  }, [selected]);

  async function handleSave() {
    if (!selected) {
      return;
    }

    setSaving(true);
    setError(null);

    const response = await updatePlatformTextApi(
      selected.key,
      editValue,
      changeNote || undefined,
    );

    setSaving(false);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setChangeNote("");
    await loadTexts();
  }

  async function handleReset() {
    if (!selected || !window.confirm("Text auf Standardwert zurücksetzen?")) {
      return;
    }

    setSaving(true);
    const response = await resetPlatformTextApi(selected.key);
    setSaving(false);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    await loadTexts();
  }

  async function handleExport() {
    const response = await exportPlatformTextsApi();

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    const blob = new Blob([JSON.stringify(response.data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `platform-texts-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport(file: File) {
    const text = await file.text();
    const parsed = JSON.parse(text) as {
      texts?: Array<{ key: string; value: string }>;
    };

    if (!parsed.texts?.length) {
      setError("Ungültige Import-Datei.");
      return;
    }

    const response = await importPlatformTextsApi(parsed.texts);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    await loadTexts();
  }

  async function loadReport() {
    setReportLoading(true);
    setReportOpen(true);
    const response = await fetchHardcodedTextReport();
    setReportLoading(false);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setReport(response.data);
  }

  const managedCount = texts.filter((row) => row.isCustomized).length;

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-aw-cream">
            Textverwaltung
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-aw-muted">
            Alle sichtbaren Plattformtexte zentral bearbeiten — mit Fallback auf
            Standardtexte, Versionierung und Änderungsprotokoll.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" className={secondaryButtonClassName} onClick={() => void handleExport()}>
            Export JSON
          </button>
          <label className={secondaryButtonClassName}>
            Import JSON
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];

                if (file) {
                  void handleImport(file);
                }
              }}
            />
          </label>
          <button type="button" className={secondaryButtonClassName} onClick={() => void loadReport()}>
            Hardcode-Report
          </button>
        </div>
      </div>

      <div className="mb-6 grid gap-4 rounded-xl border border-aw-border bg-aw-surface/60 p-4 lg:grid-cols-4">
        <div>
          <label className={labelClassName}>Kategorie</label>
          <select
            className={`${selectClassName} mt-1`}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Alle Kategorien</option>
            {PLATFORM_TEXT_CATEGORIES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-2">
          <label className={labelClassName}>Suche</label>
          <div className="mt-1 flex gap-2">
            <input
              className={inputClassName}
              placeholder="Schlüssel, Label oder Inhalt …"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setSearch(searchInput.trim());
                }
              }}
            />
            <button
              type="button"
              className={secondaryButtonClassName}
              onClick={() => setSearch(searchInput.trim())}
            >
              Suchen
            </button>
          </div>
        </div>

        <div className="flex items-end">
          <p className="text-sm text-aw-muted">
            {texts.length} Texte · {managedCount} angepasst
          </p>
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="overflow-hidden rounded-xl border border-aw-border">
          {loading ? (
            <p className="p-4 text-sm text-aw-muted">Texte werden geladen …</p>
          ) : (
            <ul className="max-h-[640px] divide-y divide-aw-border overflow-y-auto">
              {texts.map((row) => (
                <li key={row.key}>
                  <button
                    type="button"
                    onClick={() => setSelectedKey(row.key)}
                    className={`w-full px-4 py-3 text-left transition-colors hover:bg-aw-surface-2 ${
                      selectedKey === row.key ? "bg-aw-surface-2" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs text-aw-gold">{row.key}</span>
                      {row.isCustomized && (
                        <span className="rounded-full bg-aw-gold/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-aw-gold">
                          Angepasst
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm font-medium text-aw-cream">
                      {row.label ?? row.key}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs text-aw-muted">{row.value}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-aw-border bg-aw-surface/40 p-4">
          {!selected ? (
            <p className="text-sm text-aw-muted">
              Wähle links einen Text zum Bearbeiten und zur Live-Vorschau.
            </p>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="font-mono text-xs text-aw-gold">{selected.key}</p>
                <h2 className="mt-1 font-display text-lg font-bold text-aw-cream">
                  {selected.label}
                </h2>
                {selected.description && (
                  <p className="mt-1 text-xs text-aw-muted">{selected.description}</p>
                )}
              </div>

              <div>
                <label className={labelClassName}>Aktueller Text</label>
                <textarea
                  className={`${inputClassName} mt-1 min-h-[140px]`}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                />
              </div>

              <div>
                <label className={labelClassName}>Änderungsnotiz (optional)</label>
                <input
                  className={`${inputClassName} mt-1`}
                  value={changeNote}
                  onChange={(e) => setChangeNote(e.target.value)}
                />
              </div>

              <div className="rounded-lg border border-aw-border bg-aw-bg/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-aw-muted">
                  Live-Vorschau
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-aw-cream">
                  {editValue}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={primaryButtonClassName}
                  disabled={saving}
                  onClick={() => void handleSave()}
                >
                  Speichern
                </button>
                <button
                  type="button"
                  className={secondaryButtonClassName}
                  disabled={saving}
                  onClick={() => void handleReset()}
                >
                  Standard wiederherstellen
                </button>
              </div>

              <details className="rounded-lg border border-aw-border p-3">
                <summary className="cursor-pointer text-sm font-semibold text-aw-cream">
                  Versionen ({versions.length})
                </summary>
                <ul className="mt-3 space-y-2 text-xs text-aw-muted">
                  {versions.map((version) => (
                    <li key={version.id} className="rounded border border-aw-border/60 p-2">
                      <p>
                        v{version.version} ·{" "}
                        {new Date(version.createdAt).toLocaleString("de-DE")}
                      </p>
                      <p className="mt-1 line-clamp-3 text-aw-cream">{version.value}</p>
                    </li>
                  ))}
                </ul>
              </details>

              <details className="rounded-lg border border-aw-border p-3">
                <summary className="cursor-pointer text-sm font-semibold text-aw-cream">
                  Änderungsprotokoll
                </summary>
                <ul className="mt-3 space-y-2 text-xs text-aw-muted">
                  {changelog.map((entry) => (
                    <li key={entry.id}>
                      {entry.action} · {new Date(entry.createdAt).toLocaleString("de-DE")}
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          )}
        </div>
      </div>

      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[80vh] w-full max-w-4xl overflow-hidden rounded-xl border border-aw-border bg-aw-surface">
            <div className="flex items-center justify-between border-b border-aw-border px-4 py-3">
              <h3 className="font-display text-lg font-bold text-aw-cream">
                Hardcode-Report
              </h3>
              <button
                type="button"
                className={secondaryButtonClassName}
                onClick={() => setReportOpen(false)}
              >
                Schließen
              </button>
            </div>
            <div className="max-h-[calc(80vh-4rem)] overflow-y-auto p-4">
              {reportLoading || !report ? (
                <p className="text-sm text-aw-muted">Report wird erstellt …</p>
              ) : (
                <>
                  <p className="mb-4 text-sm text-aw-muted">
                    {report.totalFindings} Fundstellen · {report.managedKeys} verwaltete
                    Schlüssel im System
                  </p>
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-aw-border text-aw-muted">
                        <th className="py-2 pr-2">Datei</th>
                        <th className="py-2 pr-2">Zeile</th>
                        <th className="py-2 pr-2">Text</th>
                        <th className="py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.findings.slice(0, 200).map((finding, index) => (
                        <tr key={`${finding.file}-${finding.line}-${index}`} className="border-b border-aw-border/50">
                          <td className="py-2 pr-2 font-mono">{finding.file}</td>
                          <td className="py-2 pr-2">{finding.line}</td>
                          <td className="py-2 pr-2 text-aw-cream">{finding.text}</td>
                          <td className="py-2">
                            {finding.managed ? (
                              <span className="text-aw-success">Verwaltet</span>
                            ) : (
                              <span className="text-aw-warning">Hardcoded</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
