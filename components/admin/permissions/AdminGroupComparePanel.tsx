"use client";

import { useEffect, useMemo, useState } from "react";

import {
  getPermissionCatalogApi,
  getPermissionGroupApi,
  listPermissionGroupsApi,
} from "@/lib/permissions/permissions-client";
import type { PermissionCatalogItem } from "@/lib/permissions/permissions-client";
import type { UserGroupSummary } from "@/lib/permissions/permission-types";
import {
  inputClassName,
  labelClassName,
  primaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

type GroupPermSet = Map<string, "ALLOW" | "DENY" | null>;

export default function AdminGroupComparePanel() {
  const [groups, setGroups] = useState<UserGroupSummary[]>([]);
  const [catalog, setCatalog] = useState<PermissionCatalogItem[]>([]);
  const [groupAId, setGroupAId] = useState("");
  const [groupBId, setGroupBId] = useState("");
  const [permsA, setPermsA] = useState<GroupPermSet>(new Map());
  const [permsB, setPermsB] = useState<GroupPermSet>(new Map());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const [groupsRes, catalogRes] = await Promise.all([
        listPermissionGroupsApi(),
        getPermissionCatalogApi(),
      ]);
      setLoading(false);

      if (groupsRes.success) {
        setGroups(groupsRes.data);
        if (groupsRes.data[0]) {
          setGroupAId(groupsRes.data[0].id);
        }
        if (groupsRes.data[1]) {
          setGroupBId(groupsRes.data[1].id);
        }
      }

      if (catalogRes.success) {
        setCatalog(catalogRes.data);
      }
    })();
  }, []);

  useEffect(() => {
    if (!groupAId) {
      return;
    }

    void getPermissionGroupApi(groupAId).then((res) => {
      if (!res.success) {
        return;
      }

      const map: GroupPermSet = new Map();
      for (const entry of res.data.permissions) {
        map.set(entry.key, entry.effect);
      }
      setPermsA(map);
    });
  }, [groupAId]);

  useEffect(() => {
    if (!groupBId) {
      return;
    }

    void getPermissionGroupApi(groupBId).then((res) => {
      if (!res.success) {
        return;
      }

      const map: GroupPermSet = new Map();
      for (const entry of res.data.permissions) {
        map.set(entry.key, entry.effect);
      }
      setPermsB(map);
    });
  }, [groupBId]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();

    return catalog
      .filter(
        (item) =>
          !q ||
          item.name.toLowerCase().includes(q) ||
          item.key.toLowerCase().includes(q),
      )
      .map((item) => {
        const a = permsA.get(item.key) ?? null;
        const b = permsB.get(item.key) ?? null;
        const differs = a !== b;

        return { item, a, b, differs };
      })
      .filter((row) => row.differs || (!search && (row.a || row.b)));
  }, [catalog, permsA, permsB, search]);

  if (loading) {
    return <p className="text-sm text-aw-muted">Wird geladen …</p>;
  }

  const groupA = groups.find((g) => g.id === groupAId);
  const groupB = groups.find((g) => g.id === groupBId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-aw-cream">Gruppenvergleich</h1>
        <p className="mt-2 text-sm text-aw-muted">
          Zwei Benutzergruppen nebeneinander vergleichen — Unterschiede hervorgehoben.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className={labelClassName}>Gruppe A</label>
          <select
            className={inputClassName}
            value={groupAId}
            onChange={(e) => setGroupAId(e.target.value)}
          >
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClassName}>Gruppe B</label>
          <select
            className={inputClassName}
            value={groupBId}
            onChange={(e) => setGroupBId(e.target.value)}
          >
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <input
        className={inputClassName}
        placeholder="Rechte filtern …"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="overflow-x-auto rounded-xl border border-aw-border">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-aw-surface-2 text-aw-muted">
            <tr>
              <th className="px-3 py-2">Berechtigung</th>
              <th className="px-3 py-2">{groupA?.name ?? "A"}</th>
              <th className="px-3 py-2">{groupB?.name ?? "B"}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.item.key}
                className={`border-t border-aw-border/50 ${row.differs ? "bg-amber-500/5" : ""}`}
              >
                <td className="px-3 py-2">
                  <div className="text-aw-cream">{row.item.name}</div>
                  <div className="text-xs text-aw-muted">{row.item.key}</div>
                </td>
                <td className="px-3 py-2">{row.a ?? "—"}</td>
                <td className="px-3 py-2">{row.b ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-aw-muted">
        {rows.filter((r) => r.differs).length} Unterschiede · {rows.length} Zeilen angezeigt
      </p>
    </div>
  );
}
