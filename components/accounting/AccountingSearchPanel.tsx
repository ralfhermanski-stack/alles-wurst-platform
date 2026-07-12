"use client";

/**
 * @file AccountingSearchPanel.tsx
 * @purpose Nutzersuche für den Buchhaltungsbereich.
 */

import Link from "next/link";
import { useState, type FormEvent } from "react";

import { searchAccountingUsersApi } from "@/lib/accounting/accounting-client";
import type { AccountingSearchResult } from "@/lib/accounting/accounting-types";
import {
  MEMBERSHIP_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/users/membership-labels";
import { MEMBERSHIP_ROLE_LABELS } from "@/lib/membership/membership-labels";
import {
  inputClassName,
  primaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

export default function AccountingSearchPanel() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AccountingSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  async function handleSearch(event?: FormEvent) {
    event?.preventDefault();
    setError(null);
    setLoading(true);
    setSearched(true);

    const response = await searchAccountingUsersApi(query.trim());

    setLoading(false);

    if (!response.success) {
      setError(response.error.message);
      setResults([]);
      return;
    }

    setResults(response.data);
  }

  return (
    <div>
      <form
        className="flex flex-col gap-3 sm:flex-row"
        onSubmit={(e) => void handleSearch(e)}
      >
        <input
          className={inputClassName}
          placeholder="Name, E-Mail oder User-ID …"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          type="submit"
          className={`${primaryButtonClassName} shrink-0`}
          disabled={loading || query.trim().length < 2}
        >
          {loading ? "Suche …" : "Suchen"}
        </button>
      </form>

      {error && (
        <p className="mt-4 text-sm text-aw-warning" role="alert">
          {error}
        </p>
      )}

      {searched && !loading && results.length === 0 && !error && (
        <p className="mt-6 text-sm text-aw-muted">Keine Nutzer gefunden.</p>
      )}

      {results.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-xl border border-aw-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-aw-surface text-xs uppercase text-aw-muted">
              <tr>
                <th className="px-4 py-3">Nutzer</th>
                <th className="px-4 py-3">Rolle</th>
                <th className="px-4 py-3">Mitgliedschaft</th>
                <th className="px-4 py-3">Zahlung</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-aw-border">
              {results.map((user) => (
                <tr key={user.id} className="text-aw-cream">
                  <td className="px-4 py-3">
                    <p className="font-medium">{user.displayName}</p>
                    <p className="text-xs text-aw-muted">{user.email}</p>
                    <p className="font-mono text-xs text-aw-muted">{user.id}</p>
                  </td>
                  <td className="px-4 py-3 text-aw-muted">
                    {MEMBERSHIP_ROLE_LABELS[user.role]}
                  </td>
                  <td className="px-4 py-3 text-aw-muted">
                    {MEMBERSHIP_STATUS_LABELS[user.membershipStatus]}
                    {user.accessBlocked && (
                      <span className="mt-1 block text-aw-warning">Gesperrt</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-aw-muted">
                    {PAYMENT_STATUS_LABELS[user.paymentStatus]}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/buchhaltung/${user.id}`}
                      className="font-semibold text-aw-gold hover:text-aw-cream"
                    >
                      Öffnen →
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
