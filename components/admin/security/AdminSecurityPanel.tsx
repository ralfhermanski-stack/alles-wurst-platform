"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import {
  blockIpApi,
  fetchActiveSessionsApi,
  fetchBlockedIpsApi,
  fetchSecurityAuditLogApi,
  fetchSecurityDashboardApi,
  fetchSecurityEventsApi,
  fetchSecurityRulesApi,
  fetchSecuritySystemStatusApi,
  fetchSuspiciousUsersApi,
  unblockIpApi,
  updateSecurityRulesApi,
} from "@/lib/security/security-admin-client";
import type { SecurityDashboardStats } from "@/lib/security/security-types";
import {
  inputClassName,
  labelClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

type TabId =
  | "overview"
  | "attacks"
  | "blocked-ips"
  | "sessions"
  | "rules"
  | "suspicious"
  | "audit"
  | "status";

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "overview", label: "Übersicht" },
  { id: "attacks", label: "Angriffsversuche" },
  { id: "blocked-ips", label: "Gesperrte IPs" },
  { id: "sessions", label: "Aktive Sitzungen" },
  { id: "rules", label: "Sicherheitsregeln" },
  { id: "suspicious", label: "Verdächtige Benutzer" },
  { id: "audit", label: "Administrator-Protokoll" },
  { id: "status", label: "Systemstatus" },
];

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-aw-border bg-aw-surface/40 p-4">
      <p className="text-xs uppercase tracking-wide text-aw-muted">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold text-aw-cream">{value}</p>
    </div>
  );
}

function formatDate(value: string | Date) {
  return new Date(value).toLocaleString("de-DE");
}

export default function AdminSecurityPanel() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: TabId =
    TABS.find((tab) => tab.id === tabParam)?.id ?? "overview";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<SecurityDashboardStats | null>(null);
  const [events, setEvents] = useState<Array<Record<string, unknown>>>([]);
  const [blockedIps, setBlockedIps] = useState<Array<Record<string, unknown>>>([]);
  const [sessions, setSessions] = useState<Array<Record<string, unknown>>>([]);
  const [suspicious, setSuspicious] = useState<Array<Record<string, unknown>>>([]);
  const [auditLogs, setAuditLogs] = useState<Array<Record<string, unknown>>>([]);
  const [rules, setRules] = useState<Record<string, unknown> | null>(null);
  const [systemStatus, setSystemStatus] = useState<Record<string, unknown> | null>(null);

  const [blockForm, setBlockForm] = useState({
    ipAddress: "",
    level: "temporary_30m",
    reason: "",
    notes: "",
    permanent: false,
  });

  const loadTabData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (activeTab === "overview") {
        const response = await fetchSecurityDashboardApi();

        if (!response.success) {
          throw new Error(response.error.message);
        }

        setStats(response.data.stats);
        setSystemStatus(response.data.systemStatus);
      }

      if (activeTab === "attacks") {
        const response = await fetchSecurityEventsApi({ page: 1 });

        if (!response.success) {
          throw new Error(response.error.message);
        }

        setEvents(response.data.items);
      }

      if (activeTab === "blocked-ips") {
        const response = await fetchBlockedIpsApi(1);

        if (!response.success) {
          throw new Error(response.error.message);
        }

        setBlockedIps(response.data.items);
      }

      if (activeTab === "sessions") {
        const response = await fetchActiveSessionsApi(1);

        if (!response.success) {
          throw new Error(response.error.message);
        }

        setSessions(response.data.items);
      }

      if (activeTab === "rules") {
        const response = await fetchSecurityRulesApi();

        if (!response.success) {
          throw new Error(response.error.message);
        }

        setRules(response.data);
      }

      if (activeTab === "suspicious") {
        const response = await fetchSuspiciousUsersApi(1);

        if (!response.success) {
          throw new Error(response.error.message);
        }

        setSuspicious(response.data.items);
      }

      if (activeTab === "audit") {
        const response = await fetchSecurityAuditLogApi(1);

        if (!response.success) {
          throw new Error(response.error.message);
        }

        setAuditLogs(response.data.items);
      }

      if (activeTab === "status") {
        const response = await fetchSecuritySystemStatusApi();

        if (!response.success) {
          throw new Error(response.error.message);
        }

        setSystemStatus(response.data);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Laden fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    void loadTabData();
  }, [loadTabData]);

  async function handleBlockIp() {
    const response = await blockIpApi({
      ipAddress: blockForm.ipAddress,
      level: blockForm.level as "temporary_30m",
      reason: blockForm.reason || undefined,
      notes: blockForm.notes || undefined,
      permanent: blockForm.permanent,
    });

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setBlockForm({ ipAddress: "", level: "temporary_30m", reason: "", notes: "", permanent: false });
    await loadTabData();
  }

  async function handleUnblockIp(ipAddress: string) {
    const response = await unblockIpApi(ipAddress);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    await loadTabData();
  }

  async function handleSaveRules() {
    if (!rules) {
      return;
    }

    const response = await updateSecurityRulesApi(rules);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setRules(response.data);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <a
            key={tab.id}
            href={tab.id === "overview" ? "/admin/sicherheit" : `/admin/sicherheit?tab=${tab.id}`}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              activeTab === tab.id
                ? "bg-aw-gold/20 text-aw-gold"
                : "border border-aw-border text-aw-muted hover:text-aw-cream"
            }`}
          >
            {tab.label}
          </a>
        ))}
      </div>

      {error ? (
        <p className="rounded-lg border border-aw-warning/40 bg-aw-warning/10 px-4 py-3 text-sm text-aw-cream" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-aw-muted">Sicherheitsdaten werden geladen …</p>
      ) : null}

      {!loading && activeTab === "overview" && stats ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Fehlgeschlagene Logins heute" value={stats.failedLoginsToday} />
            <StatCard label="Gesperrte IPs" value={stats.blockedIps} />
            <StatCard label="Aktive Administratoren" value={stats.activeAdmins} />
            <StatCard label="Verdächtige Registrierungen" value={stats.suspiciousRegistrations} />
            <StatCard label="Passwort-Reset-Anfragen" value={stats.passwordResetRequests} />
            <StatCard label="API-Angriffe" value={stats.apiAttacks} />
            <StatCard label="Sicherheitswarnungen" value={stats.securityWarnings} />
          </div>

          <div className="rounded-xl border border-aw-border bg-aw-surface/40 p-4">
            <h2 className="font-display text-lg font-semibold text-aw-cream">
              Länder mit den meisten Angriffen (7 Tage)
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-aw-cream/90">
              {stats.topAttackCountries.length === 0 ? (
                <li className="text-aw-muted">Keine Angriffe in diesem Zeitraum.</li>
              ) : (
                stats.topAttackCountries.map((entry) => (
                  <li key={entry.countryCode} className="flex justify-between gap-4">
                    <span>{entry.countryCode}</span>
                    <span className="text-aw-muted">{entry.count}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      ) : null}

      {!loading && activeTab === "attacks" ? (
        <div className="overflow-x-auto rounded-xl border border-aw-border">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-aw-surface/60 text-aw-muted">
              <tr>
                <th className="px-4 py-3">Zeit</th>
                <th className="px-4 py-3">Typ</th>
                <th className="px-4 py-3">Risiko</th>
                <th className="px-4 py-3">IP</th>
                <th className="px-4 py-3">Land</th>
                <th className="px-4 py-3">Nutzer</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={String(event.id)} className="border-t border-aw-border/60">
                  <td className="px-4 py-3">{formatDate(String(event.createdAt))}</td>
                  <td className="px-4 py-3">{String(event.eventType)}</td>
                  <td className="px-4 py-3">{String(event.riskLevel)}</td>
                  <td className="px-4 py-3">{String(event.ipAddress ?? "—")}</td>
                  <td className="px-4 py-3">{String(event.countryCode ?? "—")}</td>
                  <td className="px-4 py-3">
                    {event.user && typeof event.user === "object" && "email" in event.user
                      ? String((event.user as { email: string }).email)
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {!loading && activeTab === "blocked-ips" ? (
        <div className="space-y-6">
          <div className="grid gap-4 rounded-xl border border-aw-border bg-aw-surface/40 p-4 md:grid-cols-2">
            <div>
              <label className={labelClassName} htmlFor="block-ip">IP-Adresse</label>
              <input
                id="block-ip"
                className={inputClassName}
                value={blockForm.ipAddress}
                onChange={(event) => setBlockForm((prev) => ({ ...prev, ipAddress: event.target.value }))}
              />
            </div>
            <div>
              <label className={labelClassName} htmlFor="block-level">Sperrstufe</label>
              <select
                id="block-level"
                className={inputClassName}
                value={blockForm.level}
                onChange={(event) => setBlockForm((prev) => ({ ...prev, level: event.target.value }))}
              >
                <option value="throttle">Verlangsamung</option>
                <option value="captcha">Captcha</option>
                <option value="temporary_30m">30 Minuten</option>
                <option value="extended_24h">24 Stunden</option>
                <option value="permanent">Dauerhaft</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className={labelClassName} htmlFor="block-reason">Begründung</label>
              <input
                id="block-reason"
                className={inputClassName}
                value={blockForm.reason}
                onChange={(event) => setBlockForm((prev) => ({ ...prev, reason: event.target.value }))}
              />
            </div>
            <div className="md:col-span-2 flex items-center gap-3">
              <button type="button" className={primaryButtonClassName} onClick={() => void handleBlockIp()}>
                IP sperren
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-aw-border">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-aw-surface/60 text-aw-muted">
                <tr>
                  <th className="px-4 py-3">IP</th>
                  <th className="px-4 py-3">Stufe</th>
                  <th className="px-4 py-3">Seit</th>
                  <th className="px-4 py-3">Ablauf</th>
                  <th className="px-4 py-3">Aktion</th>
                </tr>
              </thead>
              <tbody>
                {blockedIps.map((entry) => (
                  <tr key={String(entry.id)} className="border-t border-aw-border/60">
                    <td className="px-4 py-3">{String(entry.ipAddress)}</td>
                    <td className="px-4 py-3">{String(entry.level)}</td>
                    <td className="px-4 py-3">{formatDate(String(entry.blockedAt))}</td>
                    <td className="px-4 py-3">
                      {entry.expiresAt ? formatDate(String(entry.expiresAt)) : "Dauerhaft"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className={secondaryButtonClassName}
                        onClick={() => void handleUnblockIp(String(entry.ipAddress))}
                      >
                        Entsperren
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {!loading && activeTab === "sessions" ? (
        <div className="overflow-x-auto rounded-xl border border-aw-border">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-aw-surface/60 text-aw-muted">
              <tr>
                <th className="px-4 py-3">Nutzer</th>
                <th className="px-4 py-3">Gerät</th>
                <th className="px-4 py-3">Region</th>
                <th className="px-4 py-3">IP</th>
                <th className="px-4 py-3">Letzte Aktivität</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={String(session.id)} className="border-t border-aw-border/60">
                  <td className="px-4 py-3">
                    {session.user && typeof session.user === "object" && "email" in session.user
                      ? String((session.user as { email: string }).email)
                      : "—"}
                  </td>
                  <td className="px-4 py-3">{String(session.deviceLabel ?? "—")}</td>
                  <td className="px-4 py-3">
                    {[session.countryCode, session.region].filter(Boolean).join(" / ") || "—"}
                  </td>
                  <td className="px-4 py-3">{String(session.ipAddress ?? "—")}</td>
                  <td className="px-4 py-3">{formatDate(String(session.lastActiveAt))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {!loading && activeTab === "rules" && rules ? (
        <div className="grid gap-4 rounded-xl border border-aw-border bg-aw-surface/40 p-4 md:grid-cols-2">
          {[
            ["loginFailThresholdThrottle", "Fehlversuche bis Verlangsamung"],
            ["loginFailThresholdCaptcha", "Fehlversuche bis Captcha"],
            ["loginFailThreshold30m", "Fehlversuche bis 30-Min-Sperre"],
            ["loginFailThreshold24h", "Fehlversuche bis 24h-Sperre"],
            ["loginRateLimitPerIp", "Login-Limit pro IP/Min."],
            ["registerRateLimitPerIp", "Registrierungs-Limit pro IP/Min."],
            ["passwordResetRateLimitPerIp", "Reset-Limit pro IP/Min."],
            ["apiRateLimitPerIp", "API-Limit pro IP/Min."],
            ["retentionLoginAttemptsDays", "Aufbewahrung Loginversuche (Tage)"],
            ["retentionSecurityEventsDays", "Aufbewahrung Sicherheitslogs (Tage)"],
            ["retentionBlockedIpsDays", "Aufbewahrung Sperrlisten (Tage)"],
            ["retentionAuditLogDays", "Aufbewahrung Audit-Log (Tage)"],
          ].map(([key, label]) => (
            <div key={key}>
              <label className={labelClassName} htmlFor={key}>
                {label}
              </label>
              <input
                id={key}
                type="number"
                className={inputClassName}
                value={Number(rules[key] ?? 0)}
                onChange={(event) =>
                  setRules((prev) =>
                    prev ? { ...prev, [key]: Number(event.target.value) } : prev,
                  )
                }
              />
            </div>
          ))}
          <div className="md:col-span-2">
            <button type="button" className={primaryButtonClassName} onClick={() => void handleSaveRules()}>
              Regeln speichern
            </button>
          </div>
        </div>
      ) : null}

      {!loading && activeTab === "suspicious" ? (
        <div className="overflow-x-auto rounded-xl border border-aw-border">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-aw-surface/60 text-aw-muted">
              <tr>
                <th className="px-4 py-3">Nutzer</th>
                <th className="px-4 py-3">Risiko</th>
                <th className="px-4 py-3">Grund</th>
                <th className="px-4 py-3">Seit</th>
              </tr>
            </thead>
            <tbody>
              {suspicious.map((entry) => (
                <tr key={String(entry.id)} className="border-t border-aw-border/60">
                  <td className="px-4 py-3">
                    {entry.user && typeof entry.user === "object" && "email" in entry.user
                      ? String((entry.user as { email: string }).email)
                      : "—"}
                  </td>
                  <td className="px-4 py-3">{String(entry.riskLevel)}</td>
                  <td className="px-4 py-3">{String(entry.reason)}</td>
                  <td className="px-4 py-3">{formatDate(String(entry.createdAt))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {!loading && activeTab === "audit" ? (
        <div className="overflow-x-auto rounded-xl border border-aw-border">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-aw-surface/60 text-aw-muted">
              <tr>
                <th className="px-4 py-3">Zeit</th>
                <th className="px-4 py-3">Aktion</th>
                <th className="px-4 py-3">Akteur</th>
                <th className="px-4 py-3">Ergebnis</th>
                <th className="px-4 py-3">IP</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((entry) => (
                <tr key={String(entry.id)} className="border-t border-aw-border/60">
                  <td className="px-4 py-3">{formatDate(String(entry.createdAt))}</td>
                  <td className="px-4 py-3">{String(entry.action)}</td>
                  <td className="px-4 py-3">
                    {entry.actorUser && typeof entry.actorUser === "object" && "email" in entry.actorUser
                      ? String((entry.actorUser as { email: string }).email)
                      : "—"}
                  </td>
                  <td className="px-4 py-3">{String(entry.result)}</td>
                  <td className="px-4 py-3">{String(entry.ipAddress ?? "—")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {!loading && activeTab === "status" && systemStatus ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Object.entries(systemStatus).map(([key, value]) => (
            <div key={key} className="rounded-xl border border-aw-border bg-aw-surface/40 p-4">
              <p className="text-xs uppercase tracking-wide text-aw-muted">{key}</p>
              <p className="mt-2 text-sm text-aw-cream">{String(value)}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
