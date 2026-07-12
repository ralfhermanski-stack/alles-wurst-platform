"use client";

/**
 * @file AdminPageEditorList.tsx
 */

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { fetchEditablePages } from "@/lib/page-editor/page-editor-client";
import {
  EDITABLE_PAGE_CATEGORY_LABELS,
  type EditablePageCategory,
  type EditablePageListItem,
} from "@/lib/page-editor/page-editor-types";

const CATEGORY_FILTERS = Object.entries(EDITABLE_PAGE_CATEGORY_LABELS) as Array<
  [EditablePageCategory, string]
>;

export default function AdminPageEditorList() {
  const [pages, setPages] = useState<EditablePageListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<string>("");
  const [search, setSearch] = useState("");

  const loadPages = useCallback(async () => {
    setLoading(true);
    setError(null);

    const response = await fetchEditablePages({
      category: category || undefined,
      search: search || undefined,
    });

    if (!response.success) {
      setError(response.error.message);
      setPages([]);
    } else {
      setPages(response.data);
    }

    setLoading(false);
  }, [category, search]);

  useEffect(() => {
    void loadPages();
  }, [loadPages]);

  const stats = useMemo(() => {
    return {
      total: pages.length,
      drafts: pages.filter((page) => page.draftCount > 0).length,
      hardcoded: pages.filter((page) => page.hardcodedCount > 0).length,
    };
  }, [pages]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 sm:p-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-aw-cream">Seiten bearbeiten</h1>
        <p className="mt-2 max-w-3xl text-sm text-aw-muted">
          Wähle eine Seite aus und bearbeite Inhalte direkt in der visuellen Vorschau.
          Änderungen werden zunächst als Entwurf gespeichert und erst nach Veröffentlichung
          öffentlich sichtbar.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <span className="rounded-full bg-aw-surface px-3 py-1 text-aw-muted">
          {stats.total} Seiten
        </span>
        <span className="rounded-full bg-aw-gold/15 px-3 py-1 text-aw-gold">
          {stats.drafts} mit Entwürfen
        </span>
        <span className="rounded-full bg-red-500/15 px-3 py-1 text-red-300">
          {stats.hardcoded} mit Hardcode-Hinweisen
        </span>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <label className="flex-1 text-sm">
          <span className="text-aw-muted">Suche</span>
          <input
            className="mt-1 w-full rounded-md border border-aw-border bg-aw-bg px-3 py-2 text-aw-cream"
            placeholder="Seitenname, Route, Textschlüssel …"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void loadPages();
              }
            }}
          />
        </label>
        <label className="text-sm">
          <span className="text-aw-muted">Kategorie</span>
          <select
            className="mt-1 w-full min-w-48 rounded-md border border-aw-border bg-aw-bg px-3 py-2 text-aw-cream"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="">Alle Kategorien</option>
            {CATEGORY_FILTERS.map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => void loadPages()}
          className="rounded-md bg-aw-gold px-4 py-2 text-sm font-semibold text-aw-bg"
        >
          Filtern
        </button>
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-aw-muted">Seiten werden geladen …</p>
      ) : pages.length === 0 ? (
        <div className="rounded-xl border border-aw-border bg-aw-surface/40 p-8 text-center">
          <p className="text-sm text-aw-muted">
            Keine Seiten gefunden. Prüfe Filter oder führe die Datenbank-Migration aus.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-aw-border">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-aw-surface text-aw-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Seite</th>
                <th className="px-4 py-3 font-medium">Route</th>
                <th className="px-4 py-3 font-medium">Kategorie</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Bearbeitbar</th>
                <th className="px-4 py-3 font-medium">Hardcode</th>
                <th className="px-4 py-3 font-medium">Entwürfe</th>
                <th className="px-4 py-3 font-medium">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page) => (
                <tr key={page.id} className="border-t border-aw-border">
                  <td className="px-4 py-3 font-medium text-aw-cream">{page.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-aw-muted">{page.path}</td>
                  <td className="px-4 py-3 text-aw-muted">{page.categoryLabel}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={page.status} draftCount={page.draftCount} />
                  </td>
                  <td className="px-4 py-3 text-aw-muted">{page.editableCount}</td>
                  <td className="px-4 py-3">
                    {page.hardcodedCount > 0 ? (
                      <span className="text-amber-300">{page.hardcodedCount}</span>
                    ) : (
                      <span className="text-aw-muted">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-aw-muted">{page.draftCount}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/inhalte/seiteneditor/${page.id}`}
                        className="rounded-md bg-aw-gold px-3 py-1.5 text-xs font-semibold text-aw-bg"
                      >
                        Seite bearbeiten
                      </Link>
                      <a
                        href={page.path}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-md px-3 py-1.5 text-xs text-aw-cream ring-1 ring-aw-border"
                      >
                        Vorschau öffnen
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusBadge({
  status,
  draftCount,
}: {
  status: EditablePageListItem["status"];
  draftCount: number;
}) {
  if (draftCount > 0) {
    return (
      <span className="rounded-full bg-aw-gold/20 px-2 py-0.5 text-xs text-aw-gold">
        Entwurf
      </span>
    );
  }

  if (status === "published") {
    return (
      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-300">
        Veröffentlicht
      </span>
    );
  }

  return (
    <span className="rounded-full bg-aw-surface-2 px-2 py-0.5 text-xs text-aw-muted">
      Standard
    </span>
  );
}
