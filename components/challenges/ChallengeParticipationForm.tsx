"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  inputClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";
import type {
  ChallengeEntry,
  ChallengeSubmissionEntry,
} from "@/lib/challenges/challenge-types";

type ChallengeParticipationFormProps = {
  challenge: ChallengeEntry;
  initialSubmission: ChallengeSubmissionEntry | null;
};

export default function ChallengeParticipationForm({
  challenge,
  initialSubmission,
}: ChallengeParticipationFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialSubmission?.title ?? "");
  const [description, setDescription] = useState(initialSubmission?.description ?? "");
  const [recipeContent, setRecipeContent] = useState(
    initialSubmission?.recipeContent ?? "",
  );
  const [publicConsent, setPublicConsent] = useState(
    initialSubmission?.publicConsent ?? false,
  );
  const [mediaRightsConsent, setMediaRightsConsent] = useState(
    initialSubmission?.mediaRightsConsent ?? false,
  );
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveDraft() {
    await submit("draft");
  }

  async function submitFinal() {
    await submit("final");
  }

  async function submit(mode: "draft" | "final") {
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.set("challengeId", challenge.id);
    formData.set("title", title);
    formData.set("description", description);
    formData.set("recipeContent", recipeContent);
    formData.set("publicConsent", String(publicConsent));
    formData.set("mediaRightsConsent", String(mediaRightsConsent));
    formData.set("mode", mode);

    if (files) {
      for (const file of Array.from(files)) {
        formData.append("files", file);
      }
    }

    const response = await fetch("/api/challenges/submissions", {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    const json = (await response.json()) as {
      success: boolean;
      error?: { message: string };
    };

    if (!json.success) {
      setError(json.error?.message ?? "Speichern fehlgeschlagen.");
      setLoading(false);
      return;
    }

    router.push("/mein-bereich/challenges");
    router.refresh();
  }

  return (
    <div className="space-y-4 rounded-xl border border-aw-border bg-aw-surface/40 p-5">
      <div>
        <label className="mb-1 block text-sm text-aw-muted">Titel *</label>
        <input className={inputClassName} value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <label className="mb-1 block text-sm text-aw-muted">Beschreibung *</label>
        <textarea
          className={`${inputClassName} min-h-32 w-full`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-aw-muted">Rezept (optional)</label>
        <textarea
          className={`${inputClassName} min-h-24 w-full`}
          value={recipeContent}
          onChange={(e) => setRecipeContent(e.target.value)}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-aw-muted">Bilder *</label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={(e) => setFiles(e.target.files)}
          className="block w-full text-sm text-aw-muted"
        />
      </div>
      <label className="flex items-start gap-2 text-sm text-aw-muted">
        <input type="checkbox" checked={publicConsent} onChange={(e) => setPublicConsent(e.target.checked)} />
        Ich stimme der öffentlichen Darstellung meines Beitrags zu.
      </label>
      <label className="flex items-start gap-2 text-sm text-aw-muted">
        <input
          type="checkbox"
          checked={mediaRightsConsent}
          onChange={(e) => setMediaRightsConsent(e.target.checked)}
        />
        Ich bestätige, dass ich die Rechte an den hochgeladenen Medien besitze.
      </label>
      {error && <p className="text-sm text-aw-warning">{error}</p>}
      <div className="flex flex-wrap gap-3">
        <button type="button" className={secondaryButtonClassName} disabled={loading} onClick={() => void saveDraft()}>
          Entwurf speichern
        </button>
        <button
          type="button"
          className={primaryButtonClassName}
          disabled={loading || !title.trim() || !description.trim() || !publicConsent || !mediaRightsConsent}
          onClick={() => void submitFinal()}
        >
          Endgültig einreichen
        </button>
      </div>
    </div>
  );
}
