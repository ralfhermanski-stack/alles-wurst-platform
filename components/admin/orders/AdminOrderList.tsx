"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { listAdminOrdersApi } from "@/lib/admin/admin-platform-client";
import type { AdminOrderEntry } from "@/lib/admin/admin-order-service";

function formatDate(iso: string | null): string {
  if (!iso) {
    return "—";
  }

  return new Date(iso).toLocaleString("de-DE");
}

export default function AdminOrderList() {
  const [items, setItems] = useState<AdminOrderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const response = await listAdminOrdersApi();

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
        Bestellungen & Zahlungen
      </h1>
      <p className="mt-1 text-sm text-aw-muted">
        Buchhaltungspositionen aus der Datenbank (manuell / vorbereitet).
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
          Noch keine Bestellungen vorhanden.
        </p>
      )}

      {!loading && items.length > 0 && (
        <div className="mt-8 overflow-x-auto rounded-xl border border-aw-border">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-aw-surface text-aw-muted">
              <tr>
                <th className="px-4 py-3">Nutzer</th>
                <th className="px-4 py-3">Produkt</th>
                <th className="px-4 py-3">Betrag</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Anbieter</th>
                <th className="px-4 py-3">Datum</th>
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
                  </td>
                  <td className="px-4 py-3">
                    {item.title}
                    <p className="text-xs text-aw-muted">{item.productType}</p>
                  </td>
                  <td className="px-4 py-3">{item.grossAmount} €</td>
                  <td className="px-4 py-3">{item.paymentStatus}</td>
                  <td className="px-4 py-3">{item.paymentProvider ?? "—"}</td>
                  <td className="px-4 py-3">{formatDate(item.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
