"use client";

/**
 * @file ContactForm.tsx
 * @purpose Kontaktformular mit Versand und Nutzer-Feedback.
 */

import { FormEvent, useState } from "react";

type ContactFormState = {
  name: string;
  email: string;
  subject: string;
  message: string;
  website: string;
};

const initialState: ContactFormState = {
  name: "",
  email: "",
  subject: "",
  message: "",
  website: "",
};

const inputClassName =
  "mt-2 w-full rounded-md border border-aw-border bg-aw-surface px-3 py-2.5 text-sm text-aw-cream placeholder:text-aw-muted/70 focus:border-aw-gold focus:outline-none";

/**
 * Interaktives Kontaktformular mit Erfolgs-/Fehleranzeige.
 */
export default function ContactForm() {
  const [values, setValues] = useState<ContactFormState>(initialState);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  function updateField<K extends keyof ContactFormState>(
    key: K,
    value: ContactFormState[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    setFieldErrors({});

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const json = (await response.json()) as {
        success: boolean;
        message: string;
        fieldErrors?: Record<string, string>;
      };

      if (!json.success) {
        setFieldErrors(json.fieldErrors ?? {});
        setFeedback({ type: "error", message: json.message });
        return;
      }

      setValues(initialState);
      setFeedback({ type: "success", message: json.message });
    } catch {
      setFeedback({
        type: "error",
        message:
          "Netzwerkfehler — bitte Verbindung prüfen oder später erneut versuchen.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      className="space-y-5"
      aria-label="Kontaktformular"
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      noValidate
    >
      {/* Honeypot — für Nutzer unsichtbar */}
      <div className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={values.website}
          onChange={(e) => updateField("website", e.target.value)}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-aw-cream">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            autoComplete="name"
            placeholder="Dein Name"
            className={inputClassName}
            value={values.name}
            onChange={(e) => updateField("name", e.target.value)}
            disabled={submitting}
          />
          {fieldErrors.name && (
            <p className="mt-1 text-xs text-aw-warning">{fieldErrors.name}</p>
          )}
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-aw-cream">
            E-Mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="du@beispiel.de"
            className={inputClassName}
            value={values.email}
            onChange={(e) => updateField("email", e.target.value)}
            disabled={submitting}
          />
          {fieldErrors.email && (
            <p className="mt-1 text-xs text-aw-warning">{fieldErrors.email}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-aw-cream">
          Betreff
        </label>
        <input
          id="subject"
          name="subject"
          type="text"
          required
          placeholder="Worum geht es?"
          className={inputClassName}
          value={values.subject}
          onChange={(e) => updateField("subject", e.target.value)}
          disabled={submitting}
        />
        {fieldErrors.subject && (
          <p className="mt-1 text-xs text-aw-warning">{fieldErrors.subject}</p>
        )}
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-aw-cream">
          Nachricht
        </label>
        <textarea
          id="message"
          name="message"
          rows={6}
          required
          placeholder="Deine Nachricht …"
          className={inputClassName}
          value={values.message}
          onChange={(e) => updateField("message", e.target.value)}
          disabled={submitting}
        />
        {fieldErrors.message && (
          <p className="mt-1 text-xs text-aw-warning">{fieldErrors.message}</p>
        )}
      </div>

      {feedback && (
        <div
          role="status"
          className={
            feedback.type === "success"
              ? "rounded-lg border border-aw-success/40 bg-aw-success/10 px-4 py-3 text-sm text-aw-success"
              : "rounded-lg border border-aw-warning/40 bg-aw-warning/10 px-4 py-3 text-sm text-aw-warning"
          }
        >
          {feedback.message}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center justify-center rounded-md bg-aw-gold px-6 py-3 text-sm font-semibold text-aw-bg transition-colors hover:bg-aw-gold-dark hover:text-aw-cream disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Wird gesendet …" : "Nachricht senden"}
      </button>
    </form>
  );
}
