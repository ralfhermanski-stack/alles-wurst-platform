"use client";

import { useEffect, useMemo, useState } from "react";

import { getPermissionCatalogApi } from "@/lib/permissions/permissions-client";
import type { PermissionCatalogItem } from "@/lib/permissions/permissions-client";
import { PERMISSION_CATEGORY_LABELS } from "@/lib/permissions/permission-types";
import { inputClassName } from "@/components/tools/recipe-generator/recipe-form-classes";

export default function AdminPermissionsCatalogPage() {
  const [catalog, setCatalog] = useState<PermissionCatalogItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const response = await getPermissionCatalogApi();
      setLoading(false);
      if (response.success) {
        setCatalog(response.data);
      }
    })();
  }, []);

  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = catalog.filter(
      (item) =>
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.key.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q),
    );

    const map = new Map<string, PermissionCatalogItem[]>();

    for (const item of filtered) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }

    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], "de"));
  }, [catalog, search]);

  if (loading) {
    return <p className="text-sm text-aw-muted">Wird geladen …</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-aw-cream">Berechtigungskatalog</h1>
        <p className="mt-2 text-sm text-aw-muted">
          Strukturierter Katalog aller technischen Permission-Keys — nicht frei editierbar.
        </p>
      </div>

      <input
        className={inputClassName}
        placeholder="Berechtigung suchen …"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {grouped.map(([category, items]) => (
        <section key={category} className="rounded-xl border border-aw-border p-4">
          <h2 className="font-semibold text-aw-cream">
            {PERMISSION_CATEGORY_LABELS[category as keyof typeof PERMISSION_CATEGORY_LABELS] ?? category}
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {items.map((item) => (
              <li key={item.key} className="rounded-lg border border-aw-border/50 px-3 py-2">
                <div className="font-medium text-aw-cream">{item.name}</div>
                <div className="text-xs text-aw-muted">{item.key}</div>
                <div className="text-aw-muted">{item.description}</div>
                {item.isCritical && <span className="text-xs text-amber-300">Kritisch</span>}
                {item.superAdminOnly && <span className="ml-2 text-xs text-red-300">Nur Superadmin</span>}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
