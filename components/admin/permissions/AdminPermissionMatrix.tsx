"use client";

import { useMemo, useState } from "react";

import type { PermissionEffect } from "@prisma/client";

import type { PermissionCatalogItem } from "@/lib/permissions/permissions-client";
import {
  PERMISSION_ACTION_LABELS,
  PERMISSION_CATEGORY_LABELS,
  type PermissionActionKey,
} from "@/lib/permissions/permission-types";
import {
  inputClassName,
  labelClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

type MatrixEntry = {
  permissionKey: string;
  effect: PermissionEffect | null;
};

type AdminPermissionMatrixProps = {
  catalog: PermissionCatalogItem[];
  initialEntries: MatrixEntry[];
  onSave: (entries: MatrixEntry[]) => Promise<void>;
  busy?: boolean;
};

type AreaGroup = {
  areaKey: string;
  areaLabel: string;
  category: string;
  permissions: PermissionCatalogItem[];
};

function buildAreaGroups(catalog: PermissionCatalogItem[]): AreaGroup[] {
  const map = new Map<string, AreaGroup>();

  for (const item of catalog) {
    const areaKey = item.areaKey ?? item.category;
    const existing = map.get(areaKey);

    if (existing) {
      existing.permissions.push(item);
      continue;
    }

    map.set(areaKey, {
      areaKey,
      areaLabel: item.areaKey
        ? item.name.split(" — ")[0]
        : PERMISSION_CATEGORY_LABELS[item.category as keyof typeof PERMISSION_CATEGORY_LABELS] ?? item.category,
      category: item.category,
      permissions: [item],
    });
  }

  return [...map.values()].sort((a, b) => a.areaLabel.localeCompare(b.areaLabel, "de"));
}

const MATRIX_ACTIONS: PermissionActionKey[] = [
  "view",
  "open",
  "use",
  "create",
  "edit",
  "delete",
  "publish",
  "manage",
  "export",
  "share",
  "moderate",
];

export default function AdminPermissionMatrix({
  catalog,
  initialEntries,
  onSave,
  busy = false,
}: AdminPermissionMatrixProps) {
  const [entries, setEntries] = useState<MatrixEntry[]>(initialEntries);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [dirty, setDirty] = useState(false);
  const [confirmCritical, setConfirmCritical] = useState<string | null>(null);

  const entryMap = useMemo(() => {
    return new Map(entries.map((entry) => [entry.permissionKey, entry.effect]));
  }, [entries]);

  const areaGroups = useMemo(() => buildAreaGroups(catalog), [catalog]);

  const categories = useMemo(
    () => [...new Set(catalog.map((item) => item.category))].sort(),
    [catalog],
  );

  function setEffect(permissionKey: string, effect: PermissionEffect | null, isCritical: boolean) {
    if (isCritical && effect === "ALLOW" && confirmCritical !== permissionKey) {
      setConfirmCritical(permissionKey);
      return;
    }

    setEntries((current) => {
      const next = current.filter((entry) => entry.permissionKey !== permissionKey);

      if (effect) {
        next.push({ permissionKey, effect });
      }

      return next;
    });
    setDirty(true);
    setConfirmCritical(null);
  }

  function applyBulk(mode: "all" | "none" | "read" | "reset") {
    if (mode === "reset") {
      setEntries(initialEntries);
      setDirty(false);
      return;
    }

    const next: MatrixEntry[] = [];

    for (const item of catalog) {
      if (mode === "none") {
        continue;
      }

      if (mode === "read" && item.actionKey !== "view" && item.actionKey !== "open") {
        continue;
      }

      next.push({ permissionKey: item.key, effect: "ALLOW" });
    }

    setEntries(next);
    setDirty(true);
  }

  async function handleSave() {
    await onSave(entries);
    setDirty(false);
  }

  const filteredAreas = areaGroups.filter((area) => {
    if (categoryFilter && area.category !== categoryFilter) {
      return false;
    }

    if (!search.trim()) {
      return true;
    }

    const q = search.toLowerCase();
    return (
      area.areaLabel.toLowerCase().includes(q) ||
      area.permissions.some(
        (item) =>
          item.name.toLowerCase().includes(q) || item.key.toLowerCase().includes(q),
      )
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <input
          className={`${inputClassName} min-w-[220px] flex-1`}
          placeholder="Rechte suchen …"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className={inputClassName}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">Alle Bereiche</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {PERMISSION_CATEGORY_LABELS[category as keyof typeof PERMISSION_CATEGORY_LABELS] ?? category}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" className={secondaryButtonClassName} onClick={() => applyBulk("all")}>
          Alle auswählen
        </button>
        <button type="button" className={secondaryButtonClassName} onClick={() => applyBulk("none")}>
          Alle abwählen
        </button>
        <button type="button" className={secondaryButtonClassName} onClick={() => applyBulk("read")}>
          Nur Leserechte
        </button>
        <button type="button" className={secondaryButtonClassName} onClick={() => applyBulk("reset")}>
          Zurücksetzen
        </button>
      </div>

      {confirmCritical && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-100">
          <p className="font-semibold">Kritische Berechtigung</p>
          <p className="mt-1">
            Möchten Sie diese sicherheitsrelevante Berechtigung wirklich erlauben?
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              className={primaryButtonClassName}
              onClick={() => setEffect(confirmCritical, "ALLOW", false)}
            >
              Ja, erlauben
            </button>
            <button
              type="button"
              className={secondaryButtonClassName}
              onClick={() => setConfirmCritical(null)}
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {filteredAreas.map((area) => {
          const isExpanded = expanded.has(area.areaKey);

          return (
            <div key={area.areaKey} className="rounded-xl border border-aw-border bg-aw-surface">
              <button
                type="button"
                className="flex w-full items-center justify-between px-4 py-3 text-left"
                onClick={() =>
                  setExpanded((current) => {
                    const next = new Set(current);
                    if (next.has(area.areaKey)) {
                      next.delete(area.areaKey);
                    } else {
                      next.add(area.areaKey);
                    }
                    return next;
                  })
                }
              >
                <span className="font-semibold text-aw-cream">{area.areaLabel}</span>
                <span className="text-xs text-aw-muted">
                  {area.permissions.length} Rechte · {isExpanded ? "einklappen" : "aufklappen"}
                </span>
              </button>

              {isExpanded && (
                <div className="overflow-x-auto border-t border-aw-border/60 px-2 pb-3">
                  <table className="min-w-full text-left text-sm">
                    <thead className="text-aw-muted">
                      <tr>
                        <th className="px-2 py-2">Aktion</th>
                        {MATRIX_ACTIONS.map((action) => (
                          <th key={action} className="px-2 py-2 text-center">
                            {PERMISSION_ACTION_LABELS[action]}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {area.permissions.map((item) => {
                        const effect = entryMap.get(item.key) ?? null;

                        return (
                          <tr key={item.key} className="border-t border-aw-border/40">
                            <td className="px-2 py-2">
                              <div className="text-aw-cream">{item.name}</div>
                              <div className="text-xs text-aw-muted">{item.key}</div>
                              {item.isCritical && (
                                <span className="text-xs text-amber-300">Kritisch</span>
                              )}
                            </td>
                            {MATRIX_ACTIONS.map((action) => {
                              const cellKey = `${item.areaKey}.${action}`;
                              const matches =
                                item.actionKey === action || item.key.endsWith(`.${action}`);

                              if (!matches) {
                                return <td key={action} className="px-2 py-2 text-center text-aw-muted">—</td>;
                              }

                              return (
                                <td key={action} className="px-2 py-2 text-center">
                                  <select
                                    className="rounded border border-aw-border bg-aw-surface-2 px-1 py-1 text-xs text-aw-cream"
                                    value={effect ?? ""}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      setEffect(
                                        item.key,
                                        value === "ALLOW" || value === "DENY" ? value : null,
                                        item.isCritical,
                                      );
                                    }}
                                  >
                                    <option value="">—</option>
                                    <option value="ALLOW">Erlaubt</option>
                                    <option value="DENY">Verboten</option>
                                  </select>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="sticky bottom-0 z-10 -mx-2 border-t border-aw-border bg-aw-bg/95 px-2 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-aw-muted">
            {dirty ? "Ungespeicherte Änderungen" : "Alle Änderungen gespeichert"}
          </p>
          <button
            type="button"
            className={primaryButtonClassName}
            disabled={busy || !dirty}
            onClick={() => void handleSave()}
          >
            {busy ? "Speichert …" : "Berechtigungen speichern"}
          </button>
        </div>
      </div>
    </div>
  );
}
