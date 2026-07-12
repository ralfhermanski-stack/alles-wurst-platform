"use client";

import { useCallback, useEffect, useState } from "react";

import type { ForumRulesAcceptanceStatus } from "@/lib/legal/legal-acceptance-service";

export function useForumRulesAcceptance(enabled: boolean) {
  const [status, setStatus] = useState<ForumRulesAcceptanceStatus | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setStatus(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const response = await fetch("/api/legal/forum-rules/acceptance", {
      credentials: "include",
    });

    const json = (await response.json()) as {
      success: boolean;
      data?: ForumRulesAcceptanceStatus;
      error?: { message: string };
    };

    setLoading(false);

    if (!json.success || !json.data) {
      setError(json.error?.message ?? "Forenregeln konnten nicht geladen werden.");
      setStatus(null);
      return;
    }

    setError(null);
    setStatus(json.data);
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function accept(): Promise<boolean> {
    setSubmitting(true);
    setError(null);

    const response = await fetch("/api/legal/forum-rules/acceptance", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accepted: true }),
    });

    const json = (await response.json()) as {
      success: boolean;
      data?: ForumRulesAcceptanceStatus;
      error?: { message: string };
    };

    setSubmitting(false);

    if (!json.success || !json.data) {
      setError(json.error?.message ?? "Zustimmung konnte nicht gespeichert werden.");
      return false;
    }

    setStatus(json.data);
    return true;
  }

  return {
    status,
    loading,
    submitting,
    error,
    needsAcceptance: enabled && !loading && status !== null && !status.accepted,
    refresh,
    accept,
  };
}
