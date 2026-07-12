"use client";

import { useEffect, useState } from "react";

import AdminEmailNav from "@/components/admin/email/AdminEmailNav";

type Dashboard = {
  queue: { pending: number; processing: number; failed: number; sentToday: number };
  warnings: string[];
  providers: Array<{ id: string; name: string; providerType: string; active: boolean }>;
  senders: Array<{ id: string; displayName: string; emailAddress: string; verified: boolean }>;
  stats: { failed: number; bounced: number; unverifiedSenders: number };
};

export default function AdminEmailOverviewPage() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15_000);

    void fetch("/api/admin/email/dashboard", {
      credentials: "include",
      signal: controller.signal,
    })
      .then(async (response) => {
        const json = (await response.json()) as {
          success: boolean;
          data?: Dashboard;
          error?: { message?: string };
        };

        if (!response.ok || !json.success || !json.data) {
          throw new Error(json.error?.message ?? "Dashboard konnte nicht geladen werden.");
        }

        setDashboard(json.data);
        setLoadState("ready");
      })
      .catch((error: unknown) => {
        const message =
          error instanceof DOMException && error.name === "AbortError"
            ? "Zeitüberschreitung beim Laden des Dashboards."
            : error instanceof Error
              ? error.message
              : "Dashboard konnte nicht geladen werden.";
        setLoadError(message);
        setLoadState("error");
      })
      .finally(() => {
        window.clearTimeout(timeout);
      });

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, []);

  return (
    <AdminEmailNav>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Heute versendet" value={dashboard?.queue.sentToday ?? 0} />
        <StatCard label="Warteschlange" value={dashboard?.queue.pending ?? 0} />
        <StatCard label="Fehlgeschlagen" value={dashboard?.stats.failed ?? 0} />
        <StatCard label="Gesperrte Adressen" value={dashboard?.stats.bounced ?? 0} />
      </div>

      {dashboard?.warnings.length ? (
        <div className="mt-6 space-y-2">
          {dashboard.warnings.map((warning) => (
            <p
              key={warning}
              className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"
            >
              {warning}
            </p>
          ))}
        </div>
      ) : null}

      {loadState === "error" && loadError ? (
        <p className="mt-6 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {loadError}
        </p>
      ) : null}

      <section className="mt-8 grid gap-4 lg:grid-cols-2">
        <Panel title="Aktive Provider">
          <ul className="space-y-2 text-sm text-aw-muted">
            {loadState === "loading" ? (
              <li>Lade …</li>
            ) : dashboard && dashboard.providers.length > 0 ? (
              dashboard.providers.map((provider) => (
                <li key={provider.id}>
                  {provider.name} · {provider.providerType} ·{" "}
                  {provider.active ? "aktiv" : "inaktiv"}
                </li>
              ))
            ) : (
              <li>Keine Provider angelegt.</li>
            )}
          </ul>
        </Panel>
        <Panel title="Absenderadressen">
          <ul className="space-y-2 text-sm text-aw-muted">
            {loadState === "loading" ? (
              <li>Lade …</li>
            ) : dashboard && dashboard.senders.length > 0 ? (
              dashboard.senders.map((sender) => (
                <li key={sender.id}>
                  {sender.displayName} &lt;{sender.emailAddress}&gt; ·{" "}
                  {sender.verified ? "verifiziert" : "nicht verifiziert"}
                </li>
              ))
            ) : (
              <li>Keine Absender angelegt.</li>
            )}
          </ul>
        </Panel>
      </section>
    </AdminEmailNav>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-aw-border bg-aw-surface p-5">
      <p className="text-sm text-aw-muted">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold text-aw-cream">{value}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-aw-border bg-aw-surface p-5">
      <h2 className="font-display text-lg font-bold text-aw-cream">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}
