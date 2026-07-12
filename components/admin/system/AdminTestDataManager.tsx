"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import PlatformTextFallback from "@/components/platform-text/PlatformTextFallback";
import {
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";
import { adminFetch } from "@/lib/admin/admin-fetch";
import type { TestDataSummary } from "@/lib/challenges/challenge-test-data-service";

export default function AdminTestDataManager() {
  const [summary, setSummary] = useState<TestDataSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [running, setRunning] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    const response = await adminFetch<TestDataSummary>("/api/admin/test-data");

    if (!response.success) {
      setError(response.error.message);
      setLoading(false);
      return;
    }

    setSummary(response.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  async function runAction(action: string) {
    setRunning(action);
    setError(null);
    setSuccess(null);

    const response = await adminFetch("/api/admin/test-data", {
      method: "POST",
      body: JSON.stringify({ action }),
    });

    setRunning(null);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setSuccess("Aktion erfolgreich ausgeführt.");
    await loadSummary();
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-aw-cream">
            Testdaten
          </h1>
          <p className="mt-1 text-sm text-aw-warning">
            <PlatformTextFallback
              textKey="admin.challenge.testWarning"
              as="span"
              fallback="Nur in Entwicklung oder Staging verfügbar. Vor Produktivstart alle Testdaten entfernen."
            />
          </p>
        </div>
        <Link href="/admin" className={secondaryButtonClassName}>
          Zum Dashboard
        </Link>
      </div>

      {error && <p className="text-sm text-aw-warning">{error}</p>}
      {success && <p className="text-sm text-green-400">{success}</p>}
      {loading && <p className="text-sm text-aw-muted">Wird geladen …</p>}

      {summary && (
        <section className="rounded-xl border border-aw-border bg-aw-surface/40 p-5">
          <h2 className="font-display text-lg font-bold text-aw-cream">
            Social Media und Challenges
          </h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-aw-muted">Test-Kanäle</dt>
              <dd className="font-semibold text-aw-cream">{summary.socialChannels}</dd>
            </div>
            <div>
              <dt className="text-aw-muted">Test-Beiträge</dt>
              <dd className="font-semibold text-aw-cream">{summary.socialPosts}</dd>
            </div>
            <div>
              <dt className="text-aw-muted">Test-Challenges</dt>
              <dd className="font-semibold text-aw-cream">{summary.challenges}</dd>
            </div>
            <div>
              <dt className="text-aw-muted">Test-Einreichungen</dt>
              <dd className="font-semibold text-aw-cream">{summary.submissions}</dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              className={primaryButtonClassName}
              disabled={running !== null}
              onClick={() => void runAction("create_test_challenge")}
            >
              {running === "create_test_challenge"
                ? "Wird angelegt …"
                : "Test-Challenge anlegen"}
            </button>
            <button
              type="button"
              className={secondaryButtonClassName}
              disabled={running !== null}
              onClick={() => void runAction("delete_social_test_data")}
            >
              Alle Social-Media-Testdaten löschen
            </button>
            <button
              type="button"
              className={secondaryButtonClassName}
              disabled={running !== null}
              onClick={() => void runAction("delete_challenge_test_data")}
            >
              Alle Challenge-Testdaten löschen
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
