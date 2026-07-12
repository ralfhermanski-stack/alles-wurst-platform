"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import AdminPermissionMatrix from "@/components/admin/permissions/AdminPermissionMatrix";
import {
  getPermissionCatalogApi,
  getPermissionGroupApi,
  saveGroupPermissionsApi,
  updatePermissionGroupApi,
} from "@/lib/permissions/permissions-client";
import type { PermissionCatalogItem } from "@/lib/permissions/permissions-client";
import type { UserGroupDetail } from "@/lib/permissions/permission-types";
import {
  inputClassName,
  labelClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

type AdminUserGroupDetailPanelProps = {
  groupId: string;
};

export default function AdminUserGroupDetailPanel({
  groupId,
}: AdminUserGroupDetailPanelProps) {
  const [group, setGroup] = useState<UserGroupDetail | null>(null);
  const [catalog, setCatalog] = useState<PermissionCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [color, setColor] = useState("#C9A227");
  const [priority, setPriority] = useState(100);

  async function load() {
    setLoading(true);

    const [groupResponse, catalogResponse] = await Promise.all([
      getPermissionGroupApi(groupId),
      getPermissionCatalogApi(),
    ]);

    setLoading(false);

    if (!groupResponse.success) {
      setError(groupResponse.error.message);
      return;
    }

    if (!catalogResponse.success) {
      setError(catalogResponse.error.message);
      return;
    }

    setGroup(groupResponse.data);
    setCatalog(catalogResponse.data);
    setName(groupResponse.data.name);
    setDescription(groupResponse.data.description ?? "");
    setInternalNote(groupResponse.data.internalNote ?? "");
    setColor(groupResponse.data.color ?? "#C9A227");
    setPriority(groupResponse.data.priority);
    setError(null);
  }

  useEffect(() => {
    void load();
  }, [groupId]);

  async function saveMeta() {
    setBusy(true);
    setMessage(null);

    const response = await updatePermissionGroupApi(groupId, {
      name,
      description,
      internalNote,
      color,
      priority,
    });

    setBusy(false);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setMessage("Gruppendaten gespeichert.");
    await load();
  }

  async function savePermissions(
    entries: Array<{ permissionKey: string; effect: "ALLOW" | "DENY" | null }>,
  ) {
    setBusy(true);
    setMessage(null);

    const response = await saveGroupPermissionsApi(groupId, entries);
    setBusy(false);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setMessage("Berechtigungsmatrix gespeichert.");
    setGroup(response.data);
  }

  if (loading) {
    return <p className="text-sm text-aw-muted">Wird geladen …</p>;
  }

  if (!group) {
    return <p className="text-sm text-aw-warning">{error ?? "Gruppe nicht gefunden."}</p>;
  }

  const matrixEntries = group.permissions.map((entry) => ({
    permissionKey: entry.key,
    effect: entry.effect,
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/benutzer-rechte/gruppen" className="text-sm text-aw-gold hover:underline">
            ← Zurück zur Übersicht
          </Link>
          <h1 className="mt-2 font-display text-2xl font-bold text-aw-cream">{group.name}</h1>
          <p className="text-sm text-aw-muted">
            {group.isSystem ? "Systemgruppe" : "Benutzerdefinierte Gruppe"} · Status: {group.status}
          </p>
        </div>
      </div>

      {message && <p className="text-sm text-emerald-300">{message}</p>}
      {error && (
        <p className="text-sm text-aw-warning" role="alert">
          {error}
        </p>
      )}

      <section className="rounded-xl border border-aw-border bg-aw-surface p-5 space-y-4">
        <h2 className="font-display text-lg font-bold text-aw-cream">Gruppendaten</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className={labelClassName}>Name</label>
            <input className={inputClassName} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className={labelClassName}>Farbe</label>
            <input className={inputClassName} type="color" value={color} onChange={(e) => setColor(e.target.value)} />
          </div>
          <div>
            <label className={labelClassName}>Priorität</label>
            <input
              className={inputClassName}
              type="number"
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className={labelClassName}>Beschreibung</label>
            <textarea
              className={inputClassName}
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelClassName}>Interne Notiz</label>
            <textarea
              className={inputClassName}
              rows={2}
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
            />
          </div>
        </div>
        <button type="button" className={primaryButtonClassName} disabled={busy} onClick={() => void saveMeta()}>
          Metadaten speichern
        </button>
      </section>

      <section className="rounded-xl border border-aw-border bg-aw-surface p-5">
        <h2 className="mb-4 font-display text-lg font-bold text-aw-cream">Berechtigungsmatrix</h2>
        <AdminPermissionMatrix
          catalog={catalog}
          initialEntries={matrixEntries}
          onSave={savePermissions}
          busy={busy}
        />
      </section>
    </div>
  );
}
