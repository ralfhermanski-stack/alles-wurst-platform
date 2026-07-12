"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { adminFetch } from "@/lib/admin/admin-fetch";
import {
  CHALLENGE_STATUS_LABELS,
  CHALLENGE_VOTING_MODE_LABELS,
  type ChallengeEntry,
} from "@/lib/challenges/challenge-types";
import {
  inputClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

export default function AdminChallengesList() {
  const router = useRouter();
  const [challenges, setChallenges] = useState<ChallengeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);

  async function loadChallenges() {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    params.set("status", status);
    if (query.trim()) {
      params.set("q", query.trim());
    }

    const response = await adminFetch<ChallengeEntry[]>(
      `/api/admin/challenges?${params.toString()}`,
    );

    if (!response.success) {
      setError(response.error.message);
      setLoading(false);
      return;
    }

    setChallenges(response.data);
    setLoading(false);
  }

  useEffect(() => {
    void loadChallenges();
  }, [status]);

  async function publishChallenge(id: string) {
    setActionId(id);
    const response = await adminFetch(`/api/admin/challenges/${id}/publish`, {
      method: "POST",
    });
    setActionId(null);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    await loadChallenges();
  }

  function formatDate(value: string): string {
    return new Date(value).toLocaleDateString("de-DE");
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-aw-cream">Challenges</h1>
          <p className="mt-1 text-sm text-aw-muted">
            Community-Challenges erstellen, veröffentlichen und moderieren.
          </p>
        </div>
        <Link
          href="/admin/community/challenges/neu"
          className={primaryButtonClassName}
        >
          Neue Challenge
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          className={inputClassName}
          placeholder="Suche …"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <select
          className={inputClassName}
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="all">Alle</option>
          <option value="DRAFT">Entwürfe</option>
          <option value="SCHEDULED">Geplant</option>
          <option value="ACTIVE">Aktiv</option>
          <option value="VOTING">Abstimmung</option>
          <option value="COMPLETED">Abgeschlossen</option>
          <option value="ARCHIVED">Archiviert</option>
        </select>
        <button
          type="button"
          className={secondaryButtonClassName}
          onClick={() => void loadChallenges()}
        >
          Suchen
        </button>
      </div>

      {error && <p className="text-sm text-aw-warning">{error}</p>}
      {loading && <p className="text-sm text-aw-muted">Wird geladen …</p>}

      <div className="space-y-3">
        {challenges.map((challenge) => (
          <article
            key={challenge.id}
            className="rounded-xl border border-aw-border bg-aw-surface/40 p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs text-aw-muted">
                  {CHALLENGE_STATUS_LABELS[challenge.status]} ·{" "}
                  {CHALLENGE_VOTING_MODE_LABELS[challenge.votingMode]} ·{" "}
                  {challenge.submissionCount ?? 0} Einreichungen
                </p>
                <h3 className="mt-1 font-medium text-aw-cream">{challenge.title}</h3>
                {challenge.excerpt && (
                  <p className="mt-2 text-sm text-aw-muted">{challenge.excerpt}</p>
                )}
                <p className="mt-2 text-xs text-aw-muted">
                  {formatDate(challenge.startAt)} – {formatDate(challenge.endAt)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={secondaryButtonClassName}
                  onClick={() =>
                    router.push(`/admin/community/challenges/${challenge.id}`)
                  }
                >
                  Bearbeiten
                </button>
                {challenge.status === "DRAFT" && (
                  <button
                    type="button"
                    className={primaryButtonClassName}
                    disabled={actionId === challenge.id}
                    onClick={() => void publishChallenge(challenge.id)}
                  >
                    {actionId === challenge.id ? "Veröffentlichen …" : "Veröffentlichen"}
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
        {challenges.length === 0 && !loading && (
          <p className="text-sm text-aw-muted">Noch keine Challenges vorhanden.</p>
        )}
      </div>
    </div>
  );
}
