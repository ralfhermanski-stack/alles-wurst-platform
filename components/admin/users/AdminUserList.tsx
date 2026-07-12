"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { listAdminUsersApi } from "@/lib/admin/admin-platform-client";
import type { AdminUserListEntry } from "@/lib/admin/admin-user-service";
import {
  inputClassName,
  primaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

function formatDate(iso: string | null): string {
  if (!iso) {
    return "—";
  }

  return new Date(iso).toLocaleString("de-DE");
}

function statusBadgeClass(status: AdminUserListEntry["accountStatus"]): string {
  switch (status) {
    case "active":
      return "bg-emerald-500/15 text-emerald-300";
    case "suspended":
      return "bg-amber-500/15 text-amber-300";
    case "deactivated":
      return "bg-red-500/15 text-red-300";
    default:
      return "bg-aw-surface text-aw-muted";
  }
}

export default function AdminUserList() {
  const [users, setUsers] = useState<AdminUserListEntry[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoading(true);
      const response = await listAdminUsersApi(search);

      if (cancelled) {
        return;
      }

      if (!response.success) {
        setError(response.error.message);
        setUsers([]);
      } else {
        setError(null);
        setUsers(response.data);
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [search]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-aw-cream">
            Benutzer
          </h1>
          <p className="mt-1 text-sm text-aw-muted">
            Alle registrierten Nutzer aus der Datenbank.
          </p>
        </div>
        <input
          className={`${inputClassName} w-full max-w-xs`}
          placeholder="Suchen …"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {loading && (
        <p className="mt-8 text-sm text-aw-muted">Benutzer werden geladen …</p>
      )}

      {error && (
        <p className="mt-8 text-sm text-aw-warning" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && users.length === 0 && (
        <p className="mt-8 rounded-xl border border-aw-border bg-aw-surface/40 p-6 text-sm text-aw-muted">
          Noch keine Benutzer vorhanden.
        </p>
      )}

      {!loading && users.length > 0 && (
        <div className="mt-8 overflow-x-auto rounded-xl border border-aw-border">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-aw-surface text-aw-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Rolle</th>
                <th className="px-4 py-3 font-semibold">Anzeigename</th>
                <th className="px-4 py-3 font-semibold">E-Mail</th>
                <th className="px-4 py-3 font-semibold">Mitgliedschaft</th>
                <th className="px-4 py-3 font-semibold">Letzter Login</th>
                <th className="px-4 py-3 font-semibold" />
              </tr>
            </thead>
            <tbody className="divide-y divide-aw-border bg-aw-surface/30">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-aw-surface/60">
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(user.accountStatus)}`}
                    >
                      {user.accountStatusLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-aw-cream">{user.systemRoleLabel}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-aw-cream">
                      {user.publicName ?? user.displayName}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-aw-cream/90">{user.email}</td>
                  <td className="px-4 py-3 text-aw-muted">
                    {user.membershipRole ?? "—"}
                    {user.membershipStatus
                      ? ` · ${user.membershipStatus}`
                      : ""}
                  </td>
                  <td className="px-4 py-3 text-aw-muted">
                    {formatDate(user.lastLoginAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/benutzer/${user.id}`}
                      className={primaryButtonClassName}
                    >
                      Verwalten
                    </Link>
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
