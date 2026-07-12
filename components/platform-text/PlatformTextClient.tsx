"use client";

/**
 * @file PlatformTextClient.tsx
 * @purpose Client-Overlay für Inline-Bearbeitung im geschützten Editor-Modus.
 */

import { useCallback, useEffect, useState, type ElementType, type MouseEvent } from "react";
import { createPortal } from "react-dom";

import type { EditableElementType } from "@/lib/page-editor/page-editor-types";

type PlatformTextClientProps = {
  textKey: string;
  label: string;
  elementType: EditableElementType;
  value: string;
  publishedValue: string;
  defaultValue: string;
  maxLength: number | null;
  allowRichText: boolean;
  pageId: string;
  as?: ElementType;
  className?: string;
  showKey?: boolean;
};

const ELEMENT_TYPE_LABELS: Record<EditableElementType, string> = {
  text: "Fließtext",
  heading: "Hauptüberschrift",
  subheading: "Unterüberschrift",
  button: "Button",
  link: "Link",
  rich: "Formatierter Text",
  seo_title: "SEO-Titel",
  seo_description: "Meta-Beschreibung",
  image: "Bild",
  form_label: "Formularbeschriftung",
  message: "Hinweis",
};

export default function PlatformTextClient({
  textKey,
  label,
  elementType,
  value: initialValue,
  publishedValue,
  defaultValue,
  maxLength,
  allowRichText,
  pageId,
  as: Tag = "span",
  className,
  showKey = false,
}: PlatformTextClientProps) {
  const [value, setValue] = useState(initialValue);
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [hovered, setHovered] = useState(false);
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    setValue(initialValue);
    setDraft(initialValue);
  }, [initialValue]);

  const notifyParent = useCallback(
    (type: string, payload?: Record<string, unknown>) => {
      window.parent.postMessage(
        { source: "aw-page-editor", type, pageId, textKey, ...payload },
        window.location.origin,
      );
    },
    [pageId, textKey],
  );

  const saveDraft = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/page-editor/draft", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId,
          textKey,
          value: draft,
        }),
      });

      const data = (await response.json()) as {
        success: boolean;
        data?: { draftValue: string };
        error?: { message: string };
      };

      if (!response.ok || !data.success) {
        setMessage(data.error?.message ?? "Die Änderung konnte nicht gespeichert werden.");
        return;
      }

      const next = data.data?.draftValue ?? draft;
      setValue(next);
      setDraft(next);
      setMessage("Die Änderung wurde als Entwurf gespeichert.");
      notifyParent("draft_saved", { value: next, previousValue: value });
    } catch {
      setMessage("Die Änderung konnte nicht gespeichert werden.");
    } finally {
      setSaving(false);
    }
  };

  const resetToDefault = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/page-editor/reset", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId, textKey }),
      });

      const data = (await response.json()) as {
        success: boolean;
        data?: { value: string };
        error?: { message: string };
      };

      if (!response.ok || !data.success) {
        setMessage(data.error?.message ?? "Zurücksetzen fehlgeschlagen.");
        return;
      }

      const next = data.data?.value ?? defaultValue;
      setDraft(next);
      setValue(next);
      setMessage("Standardtext wurde geladen.");
      notifyParent("reset_default", { value: next });
    } catch {
      setMessage("Zurücksetzen fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  };

  const openEditor = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    notifyParent("element_selected", {
      label,
      elementType,
      value,
      publishedValue,
      defaultValue,
    });

    if (window.self === window.top) {
      setIsOpen(true);
    }
  };

  const Component = Tag;

  const editorModal =
    isOpen && portalReady ? (
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
        onClick={() => setIsOpen(false)}
      >
        <div
          className="w-full max-w-lg rounded-xl border border-aw-border bg-aw-surface p-5 shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-aw-gold">
                {ELEMENT_TYPE_LABELS[elementType]}
              </div>
              <h3 className="mt-1 font-display text-lg font-semibold text-aw-cream">
                {label}
              </h3>
            </div>
            <button
              type="button"
              className="text-aw-muted hover:text-aw-cream"
              onClick={() => setIsOpen(false)}
              aria-label="Schließen"
            >
              ✕
            </button>
          </div>

          <label className="mt-4 block text-sm text-aw-muted">Inhalt</label>
          {allowRichText ? (
            <textarea
              className="mt-1 w-full rounded-md border border-aw-border bg-aw-bg px-3 py-2 text-sm text-aw-cream"
              rows={6}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
          ) : (
            <input
              className="mt-1 w-full rounded-md border border-aw-border bg-aw-bg px-3 py-2 text-sm text-aw-cream"
              value={draft}
              maxLength={maxLength ?? undefined}
              onChange={(event) => setDraft(event.target.value)}
            />
          )}

          <div className="mt-2 flex flex-wrap gap-3 text-xs text-aw-muted">
            <span>
              Zeichen: {draft.length}
              {maxLength != null ? ` / ${maxLength}` : ""}
            </span>
            <span>Veröffentlicht: {publishedValue}</span>
          </div>

          <details className="mt-3 text-xs text-aw-muted">
            <summary className="cursor-pointer">Technik</summary>
            <p className="mt-1 font-mono">{textKey}</p>
            <p className="mt-1">Standard: {defaultValue}</p>
          </details>

          {message && (
            <p className="mt-3 text-sm text-aw-gold" role="status">
              {message}
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={saveDraft}
              className="rounded-md bg-aw-gold px-4 py-2 text-sm font-semibold text-aw-bg disabled:opacity-50"
            >
              {saving ? "Speichern …" : "Entwurf speichern"}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                setDraft(value);
                setIsOpen(false);
              }}
              className="rounded-md px-4 py-2 text-sm text-aw-cream ring-1 ring-aw-border"
            >
              Abbrechen
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={resetToDefault}
              className="rounded-md px-4 py-2 text-sm text-aw-muted hover:text-aw-cream"
            >
              Auf Standard zurücksetzen
            </button>
          </div>
        </div>
      </div>
    ) : null;

  return (
    <>
      <Component
        className={`${className ?? ""} relative cursor-pointer transition outline-none ${
          hovered ? "ring-2 ring-aw-gold/70 ring-offset-2 ring-offset-aw-bg rounded-sm" : ""
        }`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onMouseDown={(event: MouseEvent) => {
          if (window.self !== window.top) {
            event.preventDefault();
            event.stopPropagation();
          }
        }}
        onClick={openEditor}
        data-pe-key={textKey}
        data-pe-type={elementType}
        title={`${ELEMENT_TYPE_LABELS[elementType]} bearbeiten`}
      >
        {value}
        {hovered && (
          <span className="pointer-events-none absolute -top-7 left-0 z-50 whitespace-nowrap rounded bg-aw-gold px-2 py-0.5 text-[10px] font-semibold text-aw-bg shadow">
            {ELEMENT_TYPE_LABELS[elementType]}
            {showKey ? ` · ${textKey}` : ""}
          </span>
        )}
      </Component>

      {portalReady && editorModal
        ? createPortal(editorModal, document.body)
        : null}
    </>
  );
}
