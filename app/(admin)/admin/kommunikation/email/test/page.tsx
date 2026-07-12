"use client";

import { useState } from "react";

import AdminEmailNav from "@/components/admin/email/AdminEmailNav";
import {
  inputClassName,
  labelClassName,
  primaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

export default function AdminEmailTestPage() {
  const [recipientEmail, setRecipientEmail] = useState("");
  const [templateKey, setTemplateKey] = useState("auth.verify");
  const [message, setMessage] = useState<string | null>(null);

  async function sendTest() {
    const response = await fetch("/api/admin/email/send", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "test",
        recipientEmail,
        templateKey,
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
    <AdminEmailNav>
      <div className="max-w-lg space-y-4 rounded-xl border border-aw-border bg-aw-surface p-5">
        <p className="text-sm text-aw-muted">
          Testmails werden mit dem Präfix „TEST – Alles Wurst“ versendet.
        </p>
        <label className="block">
          <span className={labelClassName}>Testempfänger</span>
          <input
            className={inputClassName}
            value={recipientEmail}
            onChange={(event) => setRecipientEmail(event.target.value)}
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
        <button
          type="button"
          className={primaryButtonClassName}
          onClick={() => void sendTest()}
        >
          Test senden
        </button>
        {message && <p className="text-sm text-aw-muted">{message}</p>}
      </div>
    </AdminEmailNav>
  );
}
