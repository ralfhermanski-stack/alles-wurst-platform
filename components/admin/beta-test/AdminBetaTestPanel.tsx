"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import {
  addBetaInviteTasksApi,
  countBetaBroadcastRecipientsApi,
  createBetaInviteApi,
  listBetaInvitesApi,
  resendBetaInviteApi,
  revokeBetaInviteApi,
  sendBetaBroadcastApi,
} from "@/lib/beta-test/beta-test-client";
import type {
  BetaBroadcastAudience,
  BetaInviteListItem,
} from "@/lib/beta-test/beta-test-service";
import {
  inputClassName,
  labelClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

type TaskDraft = {
  id: string;
  title: string;
  description: string;
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Vorbereitet",
  SENT: "E-Mail gesendet",
  ACCEPTED: "Angenommen",
  EXPIRED: "Abgelaufen",
  REVOKED: "Widerrufen",
};

function newTaskDraft(): TaskDraft {
  return {
    id: crypto.randomUUID(),
    title: "",
    description: "",
  };
}

function formatDate(iso: string | null): string {
  if (!iso) {
    return "—";
  }

  return new Date(iso).toLocaleString("de-DE");
}

export default function AdminBetaTestPanel() {
  const [invites, setInvites] = useState<BetaInviteListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [personalMessage, setPersonalMessage] = useState("");
  const [tasks, setTasks] = useState<TaskDraft[]>([newTaskDraft()]);

  const [selectedInviteId, setSelectedInviteId] = useState<string | null>(null);
  const [extraTaskTitle, setExtraTaskTitle] = useState("");
  const [extraTaskDescription, setExtraTaskDescription] = useState("");

  const [broadcastSubject, setBroadcastSubject] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastAudience, setBroadcastAudience] =
    useState<BetaBroadcastAudience>("accepted");
  const [broadcastSendEmail, setBroadcastSendEmail] = useState(true);
  const [broadcastSendAccountMessage, setBroadcastSendAccountMessage] = useState(true);
  const [broadcastRecipientCount, setBroadcastRecipientCount] = useState<number | null>(
    null,
  );
  const [broadcastSending, setBroadcastSending] = useState(false);

  const loadInvites = useCallback(async () => {
    setLoading(true);
    const response = await listBetaInvitesApi();
    setLoading(false);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setError(null);
    setInvites(response.data.invites);
  }, []);

  useEffect(() => {
    void loadInvites();
  }, [loadInvites]);

  const loadBroadcastRecipientCount = useCallback(async () => {
    const response = await countBetaBroadcastRecipientsApi(broadcastAudience);

    if (response.success) {
      setBroadcastRecipientCount(response.data.recipientCount);
    }
  }, [broadcastAudience]);

  useEffect(() => {
    void loadBroadcastRecipientCount();
  }, [loadBroadcastRecipientCount]);

  function updateTask(id: string, patch: Partial<TaskDraft>) {
    setTasks((current) =>
      current.map((task) => (task.id === id ? { ...task, ...patch } : task)),
    );
  }

  function addTaskRow() {
    setTasks((current) => [...current, newTaskDraft()]);
  }

  function removeTaskRow(id: string) {
    setTasks((current) =>
      current.length <= 1 ? current : current.filter((task) => task.id !== id),
    );
  }

  async function handleInviteSubmit() {
    setSaving(true);
    setError(null);
    setSuccess(null);

    const response = await createBetaInviteApi({
      email,
      personalMessage: personalMessage.trim() || undefined,
      tasks: tasks
        .filter((task) => task.title.trim())
        .map((task) => ({
          title: task.title.trim(),
          description: task.description.trim() || undefined,
        })),
    });

    setSaving(false);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setSuccess(`Einladung an ${response.data.invite.email} wurde versendet.`);
    setEmail("");
    setPersonalMessage("");
    setTasks([newTaskDraft()]);
    await loadInvites();
  }

  async function runInviteAction(
    inviteId: string,
    action: "resend" | "revoke",
  ) {
    setSaving(true);
    setError(null);
    setSuccess(null);

    const response =
      action === "resend"
        ? await resendBetaInviteApi(inviteId)
        : await revokeBetaInviteApi(inviteId);

    setSaving(false);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setSuccess(
      action === "resend"
        ? "Einladung wurde erneut per E-Mail versendet."
        : "Einladung wurde widerrufen.",
    );
    await loadInvites();
  }

  async function handleAddExtraTask(inviteId: string) {
    if (!extraTaskTitle.trim()) {
      setError("Bitte einen Auftragstitel eingeben.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    const response = await addBetaInviteTasksApi(inviteId, [
      {
        title: extraTaskTitle.trim(),
        description: extraTaskDescription.trim() || undefined,
      },
    ]);

    setSaving(false);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setSuccess("Zusätzlicher Auftrag wurde vergeben.");
    setExtraTaskTitle("");
    setExtraTaskDescription("");
    setSelectedInviteId(null);
    await loadInvites();
  }

  async function handleBroadcastSubmit() {
    if (!broadcastSubject.trim() || !broadcastMessage.trim()) {
      setError("Bitte Betreff und Nachricht ausfüllen.");
      return;
    }

    if (!broadcastSendEmail && !broadcastSendAccountMessage) {
      setError("Mindestens ein Versandkanal muss ausgewählt sein.");
      return;
    }

    const recipientLabel =
      broadcastRecipientCount === null
        ? "die ausgewählten Tester"
        : `${broadcastRecipientCount} Tester`;

    const audienceLabel =
      broadcastAudience === "accepted"
        ? "alle angenommenen Einladungen"
        : "alle eingeladenen Tester (gesendet oder angenommen)";

    const channelParts: string[] = [];

    if (broadcastSendEmail) {
      channelParts.push("E-Mail");
    }

    if (broadcastSendAccountMessage) {
      channelParts.push("Nachricht in Mein Bereich");
    }

    const confirmed = window.confirm(
      `Nachricht wirklich an ${recipientLabel} senden?\n\nZielgruppe: ${audienceLabel}\nKanäle: ${channelParts.join(" + ")}`,
    );

    if (!confirmed) {
      return;
    }

    setBroadcastSending(true);
    setError(null);
    setSuccess(null);

    const response = await sendBetaBroadcastApi({
      subject: broadcastSubject.trim(),
      message: broadcastMessage.trim(),
      audience: broadcastAudience,
      sendEmail: broadcastSendEmail,
      sendAccountMessage: broadcastSendAccountMessage,
    });

    setBroadcastSending(false);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    const result = response.data;
    const parts = [`${result.recipientCount} Empfänger`];

    if (broadcastSendEmail) {
      parts.push(`${result.emailQueued} E-Mails in Warteschlange`);
    }

    if (broadcastSendAccountMessage) {
      parts.push(`${result.accountMessagesCreated} Account-Nachrichten`);
    }

    if (result.skippedNoAccount > 0) {
      parts.push(
        `${result.skippedNoAccount} ohne Konto (nur E-Mail, falls gewählt)`,
      );
    }

    setSuccess(`Sammelnachricht versendet: ${parts.join(" · ")}`);
    setBroadcastSubject("");
    setBroadcastMessage("");
  }


  return (
    <div className="space-y-8">
    <div className="grid gap-8 xl:grid-cols-[1.1fr_1fr]">
      <section className="rounded-xl border border-aw-border bg-aw-surface/40 p-6">
        <h2 className="font-display text-lg font-bold text-aw-cream">
          Tester einladen
        </h2>
        <p className="mt-2 text-sm text-aw-muted">
          E-Mail mit Einladungslink wird automatisch versendet. Der Tester erhält
          Betatest-Zugang und sieht die zugewiesenen Aufträge.
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label className={labelClassName} htmlFor="beta-email">
              E-Mail-Adresse
            </label>
            <input
              id="beta-email"
              type="email"
              className={`${inputClassName} mt-1 w-full`}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="tester@beispiel.de"
            />
          </div>

          <div>
            <label className={labelClassName} htmlFor="beta-message">
              Persönliche Nachricht (optional)
            </label>
            <textarea
              id="beta-message"
              className={`${inputClassName} mt-1 min-h-24 w-full`}
              value={personalMessage}
              onChange={(event) => setPersonalMessage(event.target.value)}
              placeholder="Kurze Begrüßung oder Hinweise für den Tester …"
            />
          </div>

          <div>
            <div className="flex items-center justify-between gap-3">
              <p className={labelClassName}>Aufträge für diesen Tester</p>
              <button
                type="button"
                className={secondaryButtonClassName}
                onClick={addTaskRow}
              >
                Auftrag hinzufügen
              </button>
            </div>

            <div className="mt-3 space-y-3">
              {tasks.map((task, index) => (
                <div
                  key={task.id}
                  className="rounded-lg border border-aw-border/70 bg-aw-bg/40 p-4"
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-aw-muted">
                    Auftrag {index + 1}
                  </p>
                  <input
                    className={`${inputClassName} mt-2 w-full`}
                    value={task.title}
                    onChange={(event) =>
                      updateTask(task.id, { title: event.target.value })
                    }
                    placeholder="z. B. Meisterclub-Checkout testen"
                  />
                  <textarea
                    className={`${inputClassName} mt-2 min-h-20 w-full`}
                    value={task.description}
                    onChange={(event) =>
                      updateTask(task.id, { description: event.target.value })
                    }
                    placeholder="Was genau soll getestet werden?"
                  />
                  {tasks.length > 1 && (
                    <button
                      type="button"
                      className="mt-2 text-sm text-aw-warning hover:underline"
                      onClick={() => removeTaskRow(task.id)}
                    >
                      Entfernen
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            className={primaryButtonClassName}
            disabled={saving || !email.trim()}
            onClick={() => void handleInviteSubmit()}
          >
            {saving ? "Sendet …" : "Einladung senden"}
          </button>
        </div>
      </section>

      <section className="space-y-4">
        {error && (
          <p className="text-sm text-aw-warning" role="alert">
            {error}
          </p>
        )}
        {success && (
          <p className="text-sm text-aw-success" role="status">
            {success}
          </p>
        )}

        <div className="rounded-xl border border-aw-border bg-aw-surface/40 p-6">
          <h2 className="font-display text-lg font-bold text-aw-cream">
            Einladungen
          </h2>
          <p className="mt-2 text-sm text-aw-muted">
            Übersicht aller Betatest-Einladungen und ihrer Aufträge.
          </p>

          {loading ? (
            <p className="mt-6 text-sm text-aw-muted">Lädt …</p>
          ) : invites.length === 0 ? (
            <p className="mt-6 text-sm text-aw-muted">
              Noch keine Einladungen versendet.
            </p>
          ) : (
            <div className="mt-6 space-y-3">
              {invites.map((invite) => (
                <article
                  key={invite.id}
                  className="rounded-lg border border-aw-border/70 bg-aw-bg/30 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-aw-cream">{invite.email}</p>
                      <p className="mt-1 text-xs text-aw-muted">
                        {STATUS_LABELS[invite.status] ?? invite.status} ·{" "}
                        {invite.taskCount} Auftrag/Aufträge · offen:{" "}
                        {invite.openTaskCount}
                      </p>
                      {invite.userDisplayName && (
                        <p className="mt-1 text-xs text-aw-muted">
                          Nutzer: {invite.userDisplayName}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-aw-muted">
                        Gesendet: {formatDate(invite.sentAt)} · Gültig bis:{" "}
                        {formatDate(invite.expiresAt)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {invite.userId && (
                        <Link
                          href={`/admin/benutzer/${invite.userId}`}
                          className={secondaryButtonClassName}
                        >
                          Profil
                        </Link>
                      )}
                      {invite.status !== "ACCEPTED" && invite.status !== "REVOKED" && (
                        <button
                          type="button"
                          className={secondaryButtonClassName}
                          disabled={saving}
                          onClick={() => void runInviteAction(invite.id, "resend")}
                        >
                          Erneut senden
                        </button>
                      )}
                      {invite.status !== "REVOKED" && invite.status !== "ACCEPTED" && (
                        <button
                          type="button"
                          className={secondaryButtonClassName}
                          disabled={saving}
                          onClick={() => void runInviteAction(invite.id, "revoke")}
                        >
                          Widerrufen
                        </button>
                      )}
                      <button
                        type="button"
                        className={secondaryButtonClassName}
                        disabled={saving || invite.status === "REVOKED"}
                        onClick={() =>
                          setSelectedInviteId(
                            selectedInviteId === invite.id ? null : invite.id,
                          )
                        }
                      >
                        Auftrag nachreichen
                      </button>
                    </div>
                  </div>

                  {selectedInviteId === invite.id && (
                    <div className="mt-4 border-t border-aw-border/60 pt-4">
                      <p className="text-sm text-aw-muted">
                        Zusätzlicher Auftrag für {invite.email}
                      </p>
                      <input
                        className={`${inputClassName} mt-2 w-full`}
                        value={extraTaskTitle}
                        onChange={(event) => setExtraTaskTitle(event.target.value)}
                        placeholder="Auftragstitel"
                      />
                      <textarea
                        className={`${inputClassName} mt-2 min-h-20 w-full`}
                        value={extraTaskDescription}
                        onChange={(event) =>
                          setExtraTaskDescription(event.target.value)
                        }
                        placeholder="Beschreibung"
                      />
                      <button
                        type="button"
                        className={`${primaryButtonClassName} mt-3`}
                        disabled={saving}
                        onClick={() => void handleAddExtraTask(invite.id)}
                      >
                        Auftrag speichern
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-aw-gold/20 bg-aw-gold/5 p-4 text-sm text-aw-muted">
          <p className="font-medium text-aw-cream">Hinweise</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Aktiviere parallel den Wartungsmodus unter System → Wartungsmodus.</li>
            <li>Eingeladene Tester sehen die Plattform trotz Wartung.</li>
            <li>
              Mehrere Rollen: Systemrolle und Mitgliedschaft sind je eine Stufe;
              zusätzliche Rechte über Benutzergruppen unter Benutzer & Rechte.
            </li>
          </ul>
        </div>
      </section>
    </div>

    <section className="rounded-xl border border-aw-gold/30 bg-aw-gold/5 p-6">
      <h2 className="font-display text-lg font-bold text-aw-cream">
        Nachricht an alle Tester
      </h2>
      <p className="mt-2 text-sm text-aw-muted">
        Sende ein Dankeschön oder eine Info gesammelt an deine Betatest-Empfänger —
        per E-Mail, als Nachricht in „Mein Bereich“ oder beides.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <label className={labelClassName} htmlFor="broadcast-audience">
              Zielgruppe
            </label>
            <select
              id="broadcast-audience"
              className={`${inputClassName} mt-1 w-full`}
              value={broadcastAudience}
              onChange={(event) =>
                setBroadcastAudience(event.target.value as BetaBroadcastAudience)
              }
            >
              <option value="accepted">Nur angenommene Einladungen</option>
              <option value="invited">Alle eingeladenen (gesendet oder angenommen)</option>
            </select>
            <p className="mt-1 text-xs text-aw-muted">
              {broadcastRecipientCount === null
                ? "Empfänger werden gezählt …"
                : `${broadcastRecipientCount} Empfänger für diese Zielgruppe`}
            </p>
          </div>

          <div>
            <label className={labelClassName} htmlFor="broadcast-subject">
              Betreff
            </label>
            <input
              id="broadcast-subject"
              className={`${inputClassName} mt-1 w-full`}
              value={broadcastSubject}
              onChange={(event) => setBroadcastSubject(event.target.value)}
              placeholder="z. B. Danke für euren Betatest!"
            />
          </div>

          <div>
            <label className={labelClassName} htmlFor="broadcast-message">
              Nachricht
            </label>
            <textarea
              id="broadcast-message"
              className={`${inputClassName} mt-1 min-h-40 w-full`}
              value={broadcastMessage}
              onChange={(event) => setBroadcastMessage(event.target.value)}
              placeholder="Dein Dankeschön an die Tester …"
            />
          </div>
        </div>

        <div className="space-y-4">
          <fieldset className="space-y-3 rounded-lg border border-aw-border/70 bg-aw-bg/30 p-4">
            <legend className={labelClassName}>Versandkanäle</legend>
            <label className="flex items-start gap-3 text-sm text-aw-cream">
              <input
                type="checkbox"
                className="mt-1"
                checked={broadcastSendEmail}
                onChange={(event) => setBroadcastSendEmail(event.target.checked)}
              />
              <span>
                <strong>E-Mail</strong>
                <span className="mt-1 block text-aw-muted">
                  Erreicht alle Empfänger — auch ohne Konto auf der Plattform.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-3 text-sm text-aw-cream">
              <input
                type="checkbox"
                className="mt-1"
                checked={broadcastSendAccountMessage}
                onChange={(event) =>
                  setBroadcastSendAccountMessage(event.target.checked)
                }
              />
              <span>
                <strong>Nachricht in „Mein Bereich“</strong>
                <span className="mt-1 block text-aw-muted">
                  Nur für Tester mit Konto. Erscheint unter Datenschutz & Nachrichten.
                </span>
              </span>
            </label>
          </fieldset>

          <div className="rounded-lg border border-aw-border/70 bg-aw-bg/30 p-4 text-sm text-aw-muted">
            <p className="font-medium text-aw-cream">Hinweise zum Versand</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>E-Mails werden über die Warteschlange versendet (nicht sofort).</li>
              <li>Die Anrede nutzt den Vornamen, falls ein Konto vorhanden ist.</li>
              <li>Pro E-Mail-Adresse wird nur einmal gesendet.</li>
            </ul>
          </div>

          <button
            type="button"
            className={primaryButtonClassName}
            disabled={
              broadcastSending ||
              !broadcastSubject.trim() ||
              !broadcastMessage.trim() ||
              (!broadcastSendEmail && !broadcastSendAccountMessage) ||
              broadcastRecipientCount === 0
            }
            onClick={() => void handleBroadcastSubmit()}
          >
            {broadcastSending
              ? "Sendet …"
              : `Sammelnachricht senden${broadcastRecipientCount !== null ? ` (${broadcastRecipientCount})` : ""}`}
          </button>
        </div>
      </div>
    </section>
    </div>
  );
}
