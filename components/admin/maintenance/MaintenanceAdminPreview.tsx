"use client";

import { useMemo } from "react";

import MaintenancePageContent from "@/components/maintenance/MaintenancePageContent";
import type { MaintenanceSettingsData } from "@/lib/maintenance/maintenance-types";
import { secondaryButtonClassName } from "@/components/tools/recipe-generator/recipe-form-classes";

type MaintenanceAdminPreviewProps = {
  settings: MaintenanceSettingsData;
  imageVersion: number;
};

function imagePreviewUrl(url: string | null, version: number): string | null {
  if (!url) {
    return null;
  }

  return `${url}?v=${version}`;
}

export default function MaintenanceAdminPreview({
  settings,
  imageVersion,
}: MaintenanceAdminPreviewProps) {
  const previewSettings = useMemo<MaintenanceSettingsData>(
    () => ({
      ...settings,
      logoUrl: imagePreviewUrl(settings.logoUrl, imageVersion),
      backgroundUrl: imagePreviewUrl(settings.backgroundUrl, imageVersion),
    }),
    [settings, imageVersion],
  );

  return (
    <section className="rounded-xl border border-aw-border bg-aw-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-aw-cream">Live-Vorschau</h2>
          <p className="mt-1 text-xs text-aw-muted">
            Zeigt den aktuellen Entwurf inklusive ungespeicherter Texte.
          </p>
        </div>
        <a
          href="/wartung"
          target="_blank"
          rel="noopener noreferrer"
          className={secondaryButtonClassName}
        >
          Seite öffnen
        </a>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-aw-border bg-aw-bg shadow-inner">
        <MaintenancePageContent settings={previewSettings} variant="preview" />
      </div>
    </section>
  );
}
