"use client";

import { useState } from "react";

import {
  inputClassName,
  labelClassName,
  primaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

export default function AdminEmailManualSendPanel() {
  const [recipientUserId, setRecipientUserId] = useState("");
  const [templateKey, setTemplateKey] = useState("ticket.reply");
  const [category, setCategory] = useState("TICKET");
  const [message, setMessage] = useState<string | null>(null);

  async function send() {
    const response = await fetch("/api/admin/email/send", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "manual",
        recipientUserId,
        templateKey,
        category,
        variables: {
          ticketNumber: "T-0000",
          bodyHtml: "Manuelle Mitarbeiter-Antwort.",
          supportUrl: "/mein-bereich/support",
        },
      }),
    });

    const json = (await response.json()) as {
      success: boolean;
      message?: string;
      error?: { message: string };
    };

    setMessage(json.message ?? json.error?.message ?? "Unbekannter Status");
  }

  return (
    <div className="max-w-xl space-y-4 rounded-xl border border-aw-border bg-aw-surface p-5">
      <p className="text-sm text-aw-muted">
        Manueller Versand nur über interne Benutzerauswahl. Keine freie
        Empfängerliste für Support-Mitarbeiter. Benutzer können keine E-Mails an
        andere Benutzer senden.
      </p>
      <label className="block">
        <span className={labelClassName}>Benutzer-ID (intern)</span>
        <input
          className={inputClassName}
          value={recipientUserId}
          onChange={(event) => setRecipientUserId(event.target.value)}
        />
      </label>
      <label className="block">
        <span className={labelClassName}>Kategorie</span>
        <input
          className={inputClassName}
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        />
      </label>
      <label className="block">
        <span className={labelClassName}>Vorlage</span>
        <input
          className={inputClassName}
          value={templateKey}
          onChange={(event) => setTemplateKey(event.target.value)}
        />
      </label>
      <button type="button" className={primaryButtonClassName} onClick={() => void send()}>
        E-Mail senden
      </button>
      {message && <p className="text-sm text-aw-muted">{message}</p>}
    </div>
  );
}
