"use client";

import { useId, useRef, useState } from "react";

import {
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

type AdminGroupImageUploadProps = {
  title?: string;
  entityName: string;
  imageUrl: string;
  imageFileName?: string | null;
  hasImage?: boolean;
  onUpload: (file: File) => Promise<boolean>;
};

export default function AdminGroupImageUpload({
  title = "Gruppenbild",
  entityName,
  imageUrl,
  imageFileName,
  hasImage = false,
  onUpload,
}: AdminGroupImageUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleFileSelected(file: File) {
    setUploading(true);
    setLocalError(null);

    const success = await onUpload(file);

    setUploading(false);

    if (!success) {
      setLocalError("Bild konnte nicht hochgeladen werden.");
    }
  }

  return (
    <div className="rounded-lg border border-aw-border bg-aw-bg/30 p-4">
      <h4 className="text-sm font-semibold text-aw-cream">{title}</h4>
      <p className="mt-1 text-xs text-aw-muted">
        JPG, PNG oder WebP. Wird im Kurskatalog und auf der Startseite angezeigt.
      </p>

      <div className="mt-4 flex flex-wrap items-start gap-4">
        <div className="h-28 w-44 shrink-0 overflow-hidden rounded-lg border border-aw-border bg-aw-surface">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={entityName}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="min-w-[12rem] space-y-2">
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            className="sr-only"
            disabled={uploading}
            onChange={(event) => {
              const file = event.target.files?.[0];

              if (file) {
                void handleFileSelected(file);
              }

              event.target.value = "";
            }}
          />

          <button
            type="button"
            className={hasImage ? secondaryButtonClassName : primaryButtonClassName}
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading
              ? "Wird hochgeladen …"
              : hasImage
                ? "Bild ersetzen"
                : "Bild hochladen"}
          </button>

          {imageFileName && (
            <p className="text-xs text-aw-muted">Aktuell: {imageFileName}</p>
          )}

          {localError && (
            <p className="text-xs text-aw-warning" role="alert">
              {localError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
