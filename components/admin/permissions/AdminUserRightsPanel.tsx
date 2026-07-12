"use client";

import { useCallback, useEffect, useState } from "react";

import {
  assignUserPermissionApi,
  assignUserToGroupApi,
  checkUserPermissionApi,
  getPermissionCatalogApi,
  getUserRightsApi,
  listPermissionGroupsApi,
  removeUserFromGroupApi,
  removeUserPermissionApi,
} from "@/lib/permissions/permissions-client";
import type { PermissionCatalogItem } from "@/lib/permissions/permissions-client";
import type {
  PermissionCheckResult,
  UserGroupSummary,
  UserRightsOverview,
} from "@/lib/permissions/permission-types";
import { USER_SYSTEM_ROLE_LABELS } from "@/lib/users/system-role";
import {
  inputClassName,
  labelClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

type AdminUserRightsPanelProps = {
  userId: string;
};

export default function AdminUserRightsPanel({ userId }: AdminUserRightsPanelProps) {
  const [overview, setOverview] = useState<UserRightsOverview | null>(null);
  const [catalog, setCatalog] = useState<PermissionCatalogItem[]>([]);
  const [groups, setGroups] = useState<UserGroupSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkKey, setCheckKey] = useState("workshop.salt-calculator.view");
  const [checkResult, setCheckResult] = useState<PermissionCheckResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedPermissionKey, setSelectedPermissionKey] = useState("");
  const [permissionEffect, setPermissionEffect] = useState<"ALLOW" | "DENY">("ALLOW");
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    const response = await getUserRightsApi(userId);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setOverview(response.data);
    setError(null);
  }, [userId]);

  useEffect(() => {
    void (async () => {
      const [rightsResponse, catalogResponse, groupsResponse] = await Promise.all([
        getUserRightsApi(userId),
        getPermissionCatalogApi(),
        listPermissionGroupsApi(),
      ]);

      setLoading(false);

      if (!rightsResponse.success) {
        setError(rightsResponse.error.message);
        return;
      }

      if (!catalogResponse.success) {
        setError(catalogResponse.error.message);
        return;
      }

      setOverview(rightsResponse.data);
      setCatalog(catalogResponse.data);

      if (groupsResponse.success) {
        setGroups(groupsResponse.data);
        if (groupsResponse.data.length > 0) {
          setSelectedGroupId(groupsResponse.data[0].id);
        }
      }

      if (catalogResponse.data.length > 0) {
        setSelectedPermissionKey(catalogResponse.data[0].key);
      }
    })();
  }, [userId]);

  async function handleCheck() {
    setChecking(true);
    const response = await checkUserPermissionApi(userId, checkKey);
    setChecking(false);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setCheckResult(response.data);
    setError(null);
  }

  async function handleAddGroup() {
    if (!selectedGroupId) {
      return;
    }

    setSaving(true);
    const response = await assignUserToGroupApi(userId, selectedGroupId);
    setSaving(false);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    await reload();
  }

  async function handleRemoveGroup(groupId: string) {
    setSaving(true);
    const response = await removeUserFromGroupApi(userId, groupId);
    setSaving(false);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    await reload();
  }

  async function handleAssignPermission() {
    if (!selectedPermissionKey) {
      return;
    }

    setSaving(true);
    const response = await assignUserPermissionApi(
      userId,
      selectedPermissionKey,
      permissionEffect,
    );
    setSaving(false);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    await reload();
  }

  async function handleRemovePermission(permissionKey: string) {
    setSaving(true);
    const response = await removeUserPermissionApi(userId, permissionKey);
    setSaving(false);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    await reload();
  }

  if (loading) {
    return <p className="text-sm text-aw-muted">Rechte werden geladen …</p>;
  }

  if (!overview) {
    return <p className="text-sm text-aw-warning">{error ?? "Keine Daten."}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-aw-border p-4">
          <p className="text-xs text-aw-muted">Systemrolle</p>
          <p className="font-semibold text-aw-cream">
            {USER_SYSTEM_ROLE_LABELS[overview.systemRole]}
          </p>
        </div>
        <div className="rounded-xl border border-aw-border p-4">
          <p className="text-xs text-aw-muted">Mitgliedschaft</p>
          <p className="font-semibold text-aw-cream">
            {overview.membershipRole ?? "—"} ({overview.membershipStatus ?? "—"})
          </p>
        </div>
        <div className="rounded-xl border border-aw-border p-4">
          <p className="text-xs text-aw-muted">Effektive Rechte</p>
          <p className="font-semibold text-aw-cream">{overview.effectivePermissions.length}</p>
        </div>
      </div>

      <section className="rounded-xl border border-aw-border p-4">
        <h3 className="font-semibold text-aw-cream">Zugeordnete Gruppen</h3>
        <ul className="mt-2 space-y-2 text-sm text-aw-muted">
          {overview.groups.length === 0 && <li>Keine Gruppen</li>}
          {overview.groups.map((group) => (
            <li key={group.id} className="flex flex-wrap items-center gap-2">
              <span className="text-aw-gold">{group.name}</span>
              {group.validUntil
                ? ` · gültig bis ${new Date(group.validUntil).toLocaleDateString("de-DE")}`
                : ""}
              {group.isManual ? " · manuell" : " · automatisch"}
              {group.isManual && (
                <button
                  type="button"
                  className={secondaryButtonClassName}
                  disabled={saving}
                  onClick={() => void handleRemoveGroup(group.id)}
                >
                  Entfernen
                </button>
              )}
            </li>
          ))}
        </ul>

        <div className="mt-4 flex flex-wrap items-end gap-2">
          <div>
            <label className={labelClassName} htmlFor="assign-group">
              Gruppe zuordnen
            </label>
            <select
              id="assign-group"
              className={inputClassName}
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
            >
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className={primaryButtonClassName}
            disabled={saving || !selectedGroupId}
            onClick={() => void handleAddGroup()}
          >
            Zuordnen
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-aw-border p-4">
        <h3 className="font-semibold text-aw-cream">Individuelle Rechte</h3>
        <ul className="mt-2 space-y-2 text-sm text-aw-muted">
          {overview.individualPermissions.length === 0 && (
            <li>Keine individuellen Rechte</li>
          )}
          {overview.individualPermissions.map((entry) => (
            <li key={entry.id} className="flex flex-wrap items-center gap-2">
              {entry.name} — {entry.effect === "ALLOW" ? "erlaubt" : "verboten"}
              <button
                type="button"
                className={secondaryButtonClassName}
                disabled={saving}
                onClick={() => void handleRemovePermission(entry.key)}
              >
                Entfernen
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex flex-wrap items-end gap-2">
          <div>
            <label className={labelClassName} htmlFor="assign-permission">
              Berechtigung
            </label>
            <select
              id="assign-permission"
              className={inputClassName}
              value={selectedPermissionKey}
              onChange={(e) => setSelectedPermissionKey(e.target.value)}
            >
              {catalog.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClassName} htmlFor="permission-effect">
              Wirkung
            </label>
            <select
              id="permission-effect"
              className={inputClassName}
              value={permissionEffect}
              onChange={(e) => setPermissionEffect(e.target.value as "ALLOW" | "DENY")}
            >
              <option value="ALLOW">Erlauben</option>
              <option value="DENY">Verweigern</option>
            </select>
          </div>
          <button
            type="button"
            className={primaryButtonClassName}
            disabled={saving || !selectedPermissionKey}
            onClick={() => void handleAssignPermission()}
          >
            Speichern
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-aw-border p-4">
        <h3 className="mb-3 font-semibold text-aw-cream">Berechtigung prüfen</h3>
        <div className="flex flex-wrap gap-2">
          <select
            className={inputClassName}
            value={checkKey}
            onChange={(e) => setCheckKey(e.target.value)}
          >
            {catalog.map((item) => (
              <option key={item.key} value={item.key}>
                {item.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={primaryButtonClassName}
            disabled={checking}
            onClick={() => void handleCheck()}
          >
            Prüfen
          </button>
        </div>

        {checkResult && (
          <div className="mt-3 rounded-lg border border-aw-border/60 bg-aw-surface-2 p-3 text-sm">
            <p className={checkResult.allowed ? "text-emerald-300" : "text-amber-300"}>
              {checkResult.allowed ? "Erlaubt" : "Verweigert"}
            </p>
            <p className="mt-1 text-aw-muted">{checkResult.reason}</p>
            <p className="text-aw-muted">Quelle: {checkResult.sourceLabel}</p>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-aw-border p-4">
        <h3 className="font-semibold text-aw-cream">Effektive Rechte (Auszug)</h3>
        <ul className="mt-2 max-h-64 space-y-1 overflow-auto text-sm text-aw-muted">
          {overview.effectivePermissions.slice(0, 80).map((entry) => (
            <li key={entry.key}>
              {entry.key} — {entry.sourceLabel}
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
