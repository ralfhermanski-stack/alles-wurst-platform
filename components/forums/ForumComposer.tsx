"use client";

import { useState } from "react";

import {
  inputClassName,
  primaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

type ForumComposerProps = {
  placeholder: string;
  submitLabel: string;
  onSubmit: (body: string) => Promise<boolean>;
};

export default function ForumComposer({
  placeholder,
  submitLabel,
  onSubmit,
}: ForumComposerProps) {
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!body.trim()) {
      return;
    }

    setSaving(true);
    setError(null);

    const ok = await onSubmit(body.trim());

    setSaving(false);

    if (!ok) {
      setError("Beitrag konnte nicht gespeichert werden.");
      return;
    }

    setBody("");
  }

  return (
    <div className="rounded-lg border border-aw-border bg-aw-surface/30 p-3">
      <textarea
        className={`${inputClassName} min-h-20 w-full text-sm`}
        placeholder={placeholder}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        rows={4}
      />
      {error && (
        <p className="mt-1.5 text-sm text-aw-warning" role="alert">
          {error}
        </p>
      )}
      <button
        type="button"
        className={`${primaryButtonClassName} mt-2`}
        disabled={saving || !body.trim()}
        onClick={() => void handleSubmit()}
      >
        {saving ? "Wird gespeichert …" : submitLabel}
      </button>
    </div>
  );
}
