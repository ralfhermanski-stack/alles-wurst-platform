"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { importCourseApi } from "@/lib/courses/admin-course-client";
import {
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

export default function AdminCourseImportPanel() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  async function handleImport(file: File) {
    setImporting(true);
    setError(null);

    try {
      const text = await file.text();
      const payload = JSON.parse(text) as Record<string, unknown>;
      const response = await importCourseApi(payload);

      if (!response.success) {
        setError(response.error.message);
        return;
      }

      router.push(`/admin/kurse/${response.data.id}`);
    } catch {
      setError("JSON konnte nicht gelesen oder importiert werden.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <section className="mt-8 rounded-xl border border-aw-border bg-aw-surface/40 p-5">
      <h2 className="font-semibold text-aw-cream">Kurs importieren (JSON)</h2>
      <p className="mt-2 text-sm text-aw-muted">
        Lade eine Kursstruktur als JSON hoch. Der Kurs wird als Entwurf angelegt.
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];

            if (file) {
              void handleImport(file);
            }
          }}
        />
        <button
          type="button"
          className={primaryButtonClassName}
          disabled={importing}
          onClick={() => fileInputRef.current?.click()}
        >
          {importing ? "Import läuft …" : "JSON-Datei importieren"}
        </button>
        <a
          href="/course-import/beispiel-minikurs.json"
          className={secondaryButtonClassName}
          download
        >
          Beispiel Minikurs
        </a>
        <a
          href="/course-import/beispiel-zertifikatskurs.json"
          className={secondaryButtonClassName}
          download
        >
          Beispiel Zertifikatskurs
        </a>
      </div>

      {error && (
        <p className="mt-3 text-sm text-aw-warning" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
