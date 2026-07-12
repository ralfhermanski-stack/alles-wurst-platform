"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  createPermissionGroupApi,
  duplicatePermissionGroupApi,
  listPermissionGroupsApi,
} from "@/lib/permissions/permissions-client";
import type { UserGroupSummary } from "@/lib/permissions/permission-types";
import {
  inputClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

export default function AdminUserGroupsPanel() {
  const [groups, setGroups] = useState<UserGroupSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    const response = await listPermissionGroupsApi();
    setLoading(false);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setError(null);
    setGroups(response.data);
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleCreate() {
    if (!newName.trim()) {
      return;
    }

    setBusy(true);
    const response = await createPermissionGroupApi({ name: newName.trim() });
    setBusy(false);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setNewName("");
    await load();
  }

  async function handleDuplicate(groupId: string) {
    setBusy(true);
    const response = await duplicatePermissionGroupApi(groupId);
    setBusy(false);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    await load();
  }

  if (loading) {
    return <p className="text-sm text-aw-muted">Wird geladen …</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-aw-cream">Benutzergruppen</h1>
        <p className="mt-2 text-sm text-aw-muted">
          Gruppen mit anklickbarer Berechtigungsmatrix verwalten. Mitgliedschaften können
          automatisch Gruppen zuweisen.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          className={`${inputClassName} min-w-[240px]`}
          placeholder="Neue Gruppe …"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button
          type="button"
          className={primaryButtonClassName}
          disabled={busy}
          onClick={() => void handleCreate()}
        >
          Gruppe anlegen
        </button>
      </div>

      {error && (
        <p className="text-sm text-aw-warning" role="alert">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-aw-border">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-aw-surface-2 text-aw-muted">
            <tr>
              <th className="px-3 py-2">Gruppe</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Priorität</th>
              <th className="px-3 py-2">Mitglieder</th>
              <th className="px-3 py-2">Rechte</th>
              <th className="px-3 py-2">Verknüpfung</th>
              <th className="px-3 py-2">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <tr key={group.id} className="border-t border-aw-border/60">
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-3 w-3 rounded-full"
                      style={{ backgroundColor: group.color ?? "#C9A227" }}
                    />
                    <div>
                      <Link
                        href={`/admin/benutzer-rechte/gruppen/${group.id}`}
                        className="font-semibold text-aw-gold hover:underline"
                      >
                        {group.name}
                      </Link>
                      <div className="text-xs text-aw-muted">{group.slug}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 capitalize">{group.status}</td>
                <td className="px-3 py-3">{group.priority}</td>
                <td className="px-3 py-3">{group.memberCount}</td>
                <td className="px-3 py-3">{group.permissionCount}</td>
                <td className="px-3 py-3 text-xs text-aw-muted">
                  {group.linkedMembershipRole
                    ? `Mitgliedschaft: ${group.linkedMembershipRole}`
                    : group.linkedSystemRole
                      ? `Systemrolle: ${group.linkedSystemRole}`
                      : "Manuell"}
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/admin/benutzer-rechte/gruppen/${group.id}`} className={secondaryButtonClassName}>
                      Bearbeiten
                    </Link>
                    <button
                      type="button"
                      className={secondaryButtonClassName}
                      disabled={busy}
                      onClick={() => void handleDuplicate(group.id)}
                    >
                      Duplizieren
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
