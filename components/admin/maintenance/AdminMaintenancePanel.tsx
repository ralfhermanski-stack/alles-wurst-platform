"use client";

import { useEffect, useState } from "react";

import {
  getMaintenanceAdminApi,
  removeMaintenanceImageApi,
  updateMaintenanceAdminApi,
  uploadMaintenanceImageApi,
  type MaintenanceImageKind,
} from "@/lib/maintenance/maintenance-client";
import type { MaintenanceSettingsData } from "@/lib/maintenance/maintenance-types";
import MaintenanceAdminPreview from "@/components/admin/maintenance/MaintenanceAdminPreview";
import {
  inputClassName,
  labelClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

function compressImageFile(file: File, maxWidth = 1600): Promise<File> {
  return new Promise((resolve, reject) => {
    if (file.type === "image/webp") {
      resolve(file);
      return;
    }

    const image = new Image();
    const url = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(url);

      const scale = Math.min(1, maxWidth / image.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);

      const context = canvas.getContext("2d");

      if (!context) {
        resolve(file);
        return;
      }

      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }

          resolve(
            new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), {
              type: "image/webp",
            }),
          );
        },
        "image/webp",
        0.85,
      );
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Bild konnte nicht gelesen werden."));
    };

    image.src = url;
  });
}

function imagePreviewUrl(url: string | null, version: number): string | null {
  if (!url) {
    return null;
  }

  return `${url}?v=${version}`;
}

type MaintenanceImageUploadProps = {
  kind: MaintenanceImageKind;
  label: string;
  imageUrl: string | null;
  version: number;
  disabled: boolean;
  onUpload: (kind: MaintenanceImageKind, file: File) => Promise<void>;
  onRemove: (kind: MaintenanceImageKind) => Promise<void>;
};

function MaintenanceImageUpload({
  kind,
  label,
  imageUrl,
  version,
  disabled,
  onUpload,
  onRemove,
}: MaintenanceImageUploadProps) {
  const preview = imagePreviewUrl(imageUrl, version);

  return (
    <div className="space-y-2">
      <label className={labelClassName}>{label}</label>
      {preview && (
        <div className="overflow-hidden rounded-lg border border-aw-border bg-aw-bg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt={label}
            className={
              kind === "logo"
                ? "mx-auto max-h-24 w-auto object-contain p-4"
                : "h-40 w-full object-cover"
            }
          />
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <label className={secondaryButtonClassName}>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={disabled}
            onChange={(event) => {
              const file = event.target.files?.[0];

              if (file) {
                void onUpload(kind, file);
              }

              event.target.value = "";
            }}
          />
          {preview ? "Bild ersetzen" : "Bild hochladen"}
        </label>
        {preview && (
          <button
            type="button"
            className={secondaryButtonClassName}
            disabled={disabled}
            onClick={() => void onRemove(kind)}
          >
            Bild entfernen
          </button>
        )}
      </div>
      <p className="text-xs text-aw-muted">JPEG, PNG oder WebP, maximal 5 MB.</p>
    </div>
  );
}

export default function AdminMaintenancePanel() {
  const [settings, setSettings] = useState<MaintenanceSettingsData | null>(null);
  const [signupCount, setSignupCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingKind, setUploadingKind] = useState<MaintenanceImageKind | null>(null);
  const [imageVersion, setImageVersion] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    const response = await getMaintenanceAdminApi();
    setLoading(false);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setSettings(response.data.settings);
    setSignupCount(response.data.signups.length);
  }

  async function save(patch: Partial<MaintenanceSettingsData>) {
    if (!settings) {
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    const next = { ...settings, ...patch };
    setSettings(next);

    const response = await updateMaintenanceAdminApi(patch);
    setSaving(false);

    if (!response.success) {
      setError(response.error.message);
      await load();
      return;
    }

    setSettings(response.data);
    setMessage("Einstellungen gespeichert.");
  }

  async function toggleEnabled(enabled: boolean) {
    await save({ enabled });
  }

  async function handleImageUpload(kind: MaintenanceImageKind, file: File) {
    setUploadingKind(kind);
    setError(null);
    setMessage(null);

    try {
      const compressed = await compressImageFile(file);
      const response = await uploadMaintenanceImageApi(kind, compressed);
      setUploadingKind(null);

      if (!response.success) {
        setError(response.error.message);
        return;
      }

      setSettings(response.data);
      setImageVersion((value) => value + 1);
      setMessage(kind === "logo" ? "Logo hochgeladen." : "Hintergrundbild hochgeladen.");
    } catch (uploadError) {
      setUploadingKind(null);
      setError(
        uploadError instanceof Error ? uploadError.message : "Upload fehlgeschlagen.",
      );
    }
  }

  async function handleImageRemove(kind: MaintenanceImageKind) {
    setUploadingKind(kind);
    setError(null);
    setMessage(null);

    const response = await removeMaintenanceImageApi(kind);
    setUploadingKind(null);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setSettings(response.data);
    setImageVersion((value) => value + 1);
    setMessage(kind === "logo" ? "Logo entfernt." : "Hintergrundbild entfernt.");
  }

  const imageBusy = saving || uploadingKind !== null;

  if (loading) {
    return <p className="text-sm text-aw-muted">Wird geladen …</p>;
  }

  if (!settings) {
    return (
      <p className="text-sm text-aw-warning" role="alert">
        {error ?? "Einstellungen konnten nicht geladen werden."}
      </p>
    );
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
      <div className="order-2 space-y-8 xl:order-1">
      <section className="rounded-xl border border-aw-border bg-aw-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-bold text-aw-cream">
              Wartungsmodus
            </h2>
            <p className="mt-1 text-sm text-aw-muted">
              Status:{" "}
              <span className={settings.enabled ? "text-red-300" : "text-emerald-300"}>
                {settings.enabled ? "Aktiv" : "Inaktiv"}
              </span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={primaryButtonClassName}
              disabled={saving || settings.enabled}
              onClick={() => void toggleEnabled(true)}
            >
              Wartungsmodus aktivieren
            </button>
            <button
              type="button"
              className={secondaryButtonClassName}
              disabled={saving || !settings.enabled}
              onClick={() => void toggleEnabled(false)}
            >
              Wartungsmodus deaktivieren
            </button>
          </div>
        </div>
      </section>

      {message && <p className="text-sm text-emerald-300">{message}</p>}
      {error && (
        <p className="text-sm text-aw-warning" role="alert">
          {error}
        </p>
      )}

      <section className="rounded-xl border border-aw-border bg-aw-surface p-6 space-y-5">
        <h2 className="font-display text-lg font-bold text-aw-cream">
          Wartungsseite bearbeiten
        </h2>

        <div>
          <label className={labelClassName}>Überschrift</label>
          <input
            className={inputClassName}
            value={settings.title}
            onChange={(e) => setSettings({ ...settings, title: e.target.value })}
          />
        </div>

        <div>
          <label className={labelClassName}>Text</label>
          <textarea
            className={inputClassName}
            rows={10}
            value={settings.text}
            onChange={(e) => setSettings({ ...settings, text: e.target.value })}
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-aw-cream">
          <input
            type="checkbox"
            checked={settings.showLogo}
            onChange={(e) => setSettings({ ...settings, showLogo: e.target.checked })}
          />
          Logo anzeigen
        </label>

        <MaintenanceImageUpload
          kind="logo"
          label="Logo"
          imageUrl={settings.logoUrl}
          version={imageVersion}
          disabled={imageBusy}
          onUpload={handleImageUpload}
          onRemove={handleImageRemove}
        />

        <MaintenanceImageUpload
          kind="background"
          label="Hintergrundbild"
          imageUrl={settings.backgroundUrl}
          version={imageVersion}
          disabled={imageBusy}
          onUpload={handleImageUpload}
          onRemove={handleImageRemove}
        />

        <label className="flex items-center gap-2 text-sm text-aw-cream">
          <input
            type="checkbox"
            checked={settings.countdownEnabled}
            onChange={(e) =>
              setSettings({ ...settings, countdownEnabled: e.target.checked })
            }
          />
          Countdown aktivieren
        </label>

        {settings.countdownEnabled && (
          <div>
            <label className={labelClassName}>Geplantes Enddatum</label>
            <input
              type="datetime-local"
              className={inputClassName}
              value={settings.endDate?.slice(0, 16) ?? ""}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  endDate: e.target.value
                    ? new Date(e.target.value).toISOString()
                    : null,
                })
              }
            />
          </div>
        )}

        <label className="flex items-center gap-2 text-sm text-aw-cream">
          <input
            type="checkbox"
            checked={settings.newsletterEnabled}
            onChange={(e) =>
              setSettings({ ...settings, newsletterEnabled: e.target.checked })
            }
          />
          Newsletter-Anmeldung auf Wartungsseite
        </label>

        <fieldset>
          <legend className={labelClassName}>HTTP-Status</legend>
          <div className="mt-2 space-y-2">
            <label className="flex items-center gap-2 text-sm text-aw-cream">
              <input
                type="radio"
                name="httpStatus"
                checked={settings.httpStatus === "503"}
                onChange={() => setSettings({ ...settings, httpStatus: "503" })}
              />
              503 Service Unavailable (empfohlen)
            </label>
            <label className="flex items-center gap-2 text-sm text-aw-cream">
              <input
                type="radio"
                name="httpStatus"
                checked={settings.httpStatus === "200"}
                onChange={() => setSettings({ ...settings, httpStatus: "200" })}
              />
              200 OK
            </label>
          </div>
        </fieldset>

        <button
          type="button"
          className={primaryButtonClassName}
          disabled={saving}
          onClick={() =>
            void save({
              title: settings.title,
              text: settings.text,
              showLogo: settings.showLogo,
              countdownEnabled: settings.countdownEnabled,
              endDate: settings.endDate,
              httpStatus: settings.httpStatus,
              newsletterEnabled: settings.newsletterEnabled,
            })
          }
        >
          {saving ? "Speichert …" : "Inhalte speichern"}
        </button>
      </section>

      {signupCount > 0 && (
        <section className="rounded-xl border border-aw-border bg-aw-surface p-6">
          <h2 className="font-display text-lg font-bold text-aw-cream">
            Newsletter-Anmeldungen
          </h2>
          <p className="mt-2 text-sm text-aw-muted">
            {signupCount} E-Mail-Adresse(n) während des Wartungsmodus gesammelt.
          </p>
        </section>
      )}
      </div>

      <aside className="order-1 xl:sticky xl:top-6 xl:order-2 xl:self-start">
        <MaintenanceAdminPreview settings={settings} imageVersion={imageVersion} />
      </aside>
    </div>
  );
}
