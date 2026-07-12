"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { listAdminMembershipsApi } from "@/lib/admin/admin-platform-client";
import type { AdminMembershipEntry } from "@/lib/admin/admin-membership-service";

function formatDate(iso: string | null): string {
  if (!iso) {
    return "—";
  }

  return new Date(iso).toLocaleDateString("de-DE");
}

export default function AdminMembershipList() {
  const [items, setItems] = useState<AdminMembershipEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const response = await listAdminMembershipsApi();

      if (!response.success) {
        setError(response.error.message);
      } else {
        setItems(response.data);
      }

      setLoading(false);
    })();
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-aw-cream">
        Mitgliedschaften
      </h1>
      <p className="mt-1 text-sm text-aw-muted">
        Mitgliedschaftslevel — getrennt von Systemrollen (Admin).
      </p>

      {loading && (
        <p className="mt-8 text-sm text-aw-muted">Wird geladen …</p>
      )}

      {error && (
        <p className="mt-8 text-sm text-aw-warning" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && items.length === 0 && (
        <p className="mt-8 rounded-xl border border-aw-border bg-aw-surface/40 p-6 text-sm text-aw-muted">
          Noch keine Mitgliedschaften vorhanden.
        </p>
      )}

      {!loading && items.length > 0 && (
        <div className="mt-8 overflow-x-auto rounded-xl border border-aw-border">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-aw-surface text-aw-muted">
              <tr>
                <th className="px-4 py-3">Nutzer</th>
                <th className="px-4 py-3">Typ</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Zahlung</th>
                <th className="px-4 py-3">Start</th>
                <th className="px-4 py-3">Ende</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-aw-border">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/benutzer/${item.userId}`}
                      className="text-aw-cream hover:text-aw-gold"
                    >
                      {item.userName}
                    </Link>
                    <p className="text-xs text-aw-muted">{item.userEmail}</p>
                  </td>
                  <td className="px-4 py-3">{item.roleLabel}</td>
                  <td className="px-4 py-3">{item.status}</td>
                  <td className="px-4 py-3">{item.paymentStatus}</td>
                  <td className="px-4 py-3">{formatDate(item.startedAt)}</td>
                  <td className="px-4 py-3">{formatDate(item.endsAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
