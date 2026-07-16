"use client";

import { useId, useRef, useState } from "react";

import UserAvatar from "@/components/member/UserAvatar";
import {
  MAX_AVATAR_BYTES,
  MAX_AVATAR_SIZE_LABEL,
} from "@/lib/users/user-avatar-limits";
import {
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

type ProfileAvatarUploadProps = {
  profile: {
    publicName?: string | null;
    firstName?: string | null;
    avatarUrl?: string | null;
  };
  avatarUrl: string | null;
  onUpload: (file: File) => Promise<boolean>;
  onRemove: () => Promise<boolean>;
};

export default function ProfileAvatarUpload({
  profile,
  avatarUrl,
  onUpload,
  onRemove,
}: ProfileAvatarUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const previewProfile = {
    ...profile,
    avatarUrl,
  };

  const hasUploadedAvatar = Boolean(
    avatarUrl?.startsWith("/api/users/"),
  );

  async function handleFileSelected(file: File) {
    setUploading(true);
    setLocalError(null);

    if (file.size > MAX_AVATAR_BYTES) {
      setUploading(false);
      setLocalError(`Die Datei ist zu groß (max. ${MAX_AVATAR_SIZE_LABEL}).`);
      return;
    }

    const success = await onUpload(file);

    setUploading(false);

    if (!success) {
      setLocalError("Avatar konnte nicht hochgeladen werden.");
    }
  }

  async function handleRemove() {
    setRemoving(true);
    setLocalError(null);

    const success = await onRemove();

    setRemoving(false);

    if (!success) {
      setLocalError("Avatar konnte nicht entfernt werden.");
    }
  }

  return (
    <div className="sm:col-span-2 rounded-lg border border-aw-border bg-aw-bg/30 p-4">
      <p className="text-sm font-semibold text-aw-cream">Profilbild</p>
      <p className="mt-1 text-xs text-aw-muted">
        JPG, PNG oder WebP, max. {MAX_AVATAR_SIZE_LABEL}. Wird öffentlich in
        Bewertungen angezeigt.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <UserAvatar profile={previewProfile} size="md" className="h-16 w-16 text-base" />

        <div className="space-y-2">
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            className="sr-only"
            disabled={uploading || removing}
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
            className={primaryButtonClassName}
            disabled={uploading || removing}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? "Wird hochgeladen …" : "Bild hochladen"}
          </button>

          {hasUploadedAvatar && (
            <button
              type="button"
              className={secondaryButtonClassName}
              disabled={uploading || removing}
              onClick={() => void handleRemove()}
            >
              {removing ? "Wird entfernt …" : "Bild entfernen"}
            </button>
          )}
        </div>
      </div>

      {localError && (
        <p className="mt-3 text-sm text-aw-warning" role="alert">
          {localError}
        </p>
      )}
    </div>
  );
}
