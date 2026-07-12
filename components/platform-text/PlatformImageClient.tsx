"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { uploadPageEditorImageApi } from "@/lib/page-editor/page-editor-client";

type PlatformImageClientProps = {
  textKey: string;
  altKey?: string;
  label: string;
  pageId: string;
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  className?: string;
  sizes?: string;
};

export default function PlatformImageClient({
  textKey,
  altKey,
  label,
  pageId,
  src,
  alt,
  width,
  height,
  fill,
  priority,
  className,
  sizes,
}: PlatformImageClientProps) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [isOpen, setIsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    setCurrentSrc(src);
  }, [src]);

  const handleUpload = async (file: File | null) => {
    if (!file) {
      return;
    }

    setUploading(true);
    setMessage(null);

    const response = await uploadPageEditorImageApi({
      pageId,
      textKey,
      file,
    });

    setUploading(false);

    if (!response.success) {
      setMessage(response.error.message);
      return;
    }

    setCurrentSrc(response.data.url);
    setMessage("Bild wurde als Entwurf gespeichert.");
    window.parent.postMessage(
      {
        source: "aw-page-editor",
        type: "draft_saved",
        pageId,
        textKey,
        value: response.data.draftValue,
      },
      window.location.origin,
    );
  };

  const imageNode = currentSrc ? (
    fill ? (
      <Image
        src={currentSrc}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes ?? "100vw"}
        className={className}
      />
    ) : (
      <Image
        src={currentSrc}
        alt={alt}
        width={width ?? 1200}
        height={height ?? 800}
        priority={priority}
        className={className}
      />
    )
  ) : (
    <div
      className={`flex items-center justify-center bg-aw-surface/80 text-aw-muted ${
        fill ? "absolute inset-0 min-h-32" : "min-h-32 w-full rounded-lg"
      } ${className ?? ""}`}
    >
      <span className="px-4 text-center text-sm">Bild hinzufügen</span>
    </div>
  );

  return (
    <>
      <div
        className={`relative ${hovered ? "outline outline-2 outline-aw-gold/80 outline-offset-2" : ""}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onMouseDown={(event) => {
          if (window.self !== window.top) {
            event.preventDefault();
            event.stopPropagation();
          }
        }}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();

          if (window.self !== window.top) {
            window.parent.postMessage(
              {
                source: "aw-page-editor",
                type: "element_selected",
                pageId,
                textKey,
                label,
                elementType: "image",
                value: currentSrc,
              },
              window.location.origin,
            );
            return;
          }

          setIsOpen(true);
        }}
        data-pe-key={textKey}
        data-pe-type="image"
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setIsOpen(true);
          }
        }}
      >
        {imageNode}
        {hovered && (
          <span className="absolute left-2 top-2 z-20 rounded bg-aw-gold px-2 py-0.5 text-[10px] font-semibold text-aw-bg shadow">
            Bild bearbeiten
          </span>
        )}
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-xl border border-aw-border bg-aw-surface p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="font-display text-lg font-semibold text-aw-cream">{label}</h3>
            <p className="mt-1 text-xs text-aw-muted">{textKey}</p>

            <div className="mt-4 overflow-hidden rounded-lg border border-aw-border bg-aw-bg">
              {currentSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={currentSrc} alt={alt} className="max-h-56 w-full object-contain" />
              ) : (
                <div className="flex min-h-32 items-center justify-center text-sm text-aw-muted">
                  Noch kein Bild hinterlegt
                </div>
              )}
            </div>

            <label className="mt-4 block text-sm text-aw-muted">
              Neues Bild hochladen (JPEG, PNG, WebP, max. 5 MB — wird automatisch skaliert)
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="mt-2 block w-full text-sm text-aw-cream"
                disabled={uploading}
                onChange={(event) => void handleUpload(event.target.files?.[0] ?? null)}
              />
            </label>

            {altKey && (
              <p className="mt-2 text-xs text-aw-muted">
                Alternativtext: <span className="text-aw-cream">{alt}</span>
              </p>
            )}

            {message && <p className="mt-3 text-sm text-aw-gold">{message}</p>}

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                className="rounded-md px-4 py-2 text-sm text-aw-cream ring-1 ring-aw-border"
                onClick={() => setIsOpen(false)}
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
