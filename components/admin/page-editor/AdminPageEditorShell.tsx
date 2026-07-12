"use client";

/**
 * @file AdminPageEditorShell.tsx
 */

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  createPageEditorSessionApi,
  discardPageEditorDraftsApi,
  enterPageEditorPreviewApi,
  fetchPageEditorElements,
  publishPageEditorDraftsApi,
  savePageEditorDraftApi,
} from "@/lib/page-editor/page-editor-client";
import type {
  PageEditorElementPayload,
  PreviewRole,
  ViewportMode,
} from "@/lib/page-editor/page-editor-types";
import { getEditablePageById } from "@/lib/page-editor/page-registry";

type HistoryEntry = {
  textKey: string;
  previous: string;
  next: string;
};

type AdminPageEditorShellProps = {
  pageId: string;
};

export default function AdminPageEditorShell({ pageId }: AdminPageEditorShellProps) {
  const page = getEditablePageById(pageId);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [frameUrl, setFrameUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [frameLoading, setFrameLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [viewport, setViewport] = useState<ViewportMode>("desktop");
  const [editMode, setEditMode] = useState(true);
  const [previewRole, setPreviewRole] = useState<PreviewRole>("guest");
  const [elements, setElements] = useState<PageEditorElementPayload[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [undoStack, setUndoStack] = useState<HistoryEntry[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryEntry[]>([]);
  const [dirty, setDirty] = useState(false);
  const [editDraft, setEditDraft] = useState("");
  const [savingDraft, setSavingDraft] = useState(false);

  const loadSession = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [sessionResponse, elementsResponse] = await Promise.all([
      createPageEditorSessionApi(pageId),
      fetchPageEditorElements(pageId),
    ]);

    if (!sessionResponse.success) {
      setError(sessionResponse.error.message);
      setLoading(false);
      return;
    }

    const enterResponse = await enterPageEditorPreviewApi(
      pageId,
      sessionResponse.data.previewToken,
    );

    if (!enterResponse.success) {
      setError(enterResponse.error.message);
      setLoading(false);
      return;
    }

    setFrameLoading(true);
    setFrameUrl(sessionResponse.data.frameUrl);
    setElements(elementsResponse.success ? elementsResponse.data : []);
    setLoading(false);
  }, [pageId]);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  useEffect(() => {
    if (!frameLoading) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setFrameLoading(false);
    }, 8000);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [frameLoading, frameUrl]);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }

      const data = event.data as {
        source?: string;
        type?: string;
        textKey?: string;
        value?: string;
        previousValue?: string;
        label?: string;
      };

      if (data.source !== "aw-page-editor") {
        return;
      }

      if (data.type === "preview_ready") {
        setFrameLoading(false);
      }

      if (data.type === "element_selected" && data.textKey) {
        setSelectedKey(data.textKey);

        if (data.value != null) {
          setEditDraft(data.value);
        }
      }

      if (data.type === "draft_saved" && data.textKey && data.value != null) {
        setDirty(true);
        setMessage("Die Änderung wurde als Entwurf gespeichert.");

        if (data.previousValue != null) {
          setUndoStack((stack) => [
            ...stack,
            {
              textKey: data.textKey!,
              previous: data.previousValue!,
              next: data.value!,
            },
          ]);
          setRedoStack([]);
        }

        setElements((current) =>
          current.map((element) =>
            element.textKey === data.textKey
              ? { ...element, value: data.value!, draftValue: data.value! }
              : element,
          ),
        );
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty]);

  const reloadPreview = useCallback(() => {
    setFrameLoading(true);
    iframeRef.current?.contentWindow?.location.reload();
  }, []);

  const saveSelectedDraft = async () => {
    if (!selected) {
      return;
    }

    setSavingDraft(true);
    setMessage(null);

    const previousValue = selected.value;
    const response = await savePageEditorDraftApi({
      pageId,
      textKey: selected.textKey,
      value: editDraft,
    });

    setSavingDraft(false);

    if (!response.success) {
      setMessage(response.error.message ?? "Die Änderung konnte nicht gespeichert werden.");
      return;
    }

    const nextValue = response.data.draftValue;
    setDirty(true);
    setMessage("Die Änderung wurde als Entwurf gespeichert.");
    setUndoStack((stack) => [
      ...stack,
      { textKey: selected.textKey, previous: previousValue, next: nextValue },
    ]);
    setRedoStack([]);
    setElements((current) =>
      current.map((element) =>
        element.textKey === selected.textKey
          ? { ...element, value: nextValue, draftValue: nextValue }
          : element,
      ),
    );
    reloadPreview();
  };

  const publish = async () => {
    setMessage(null);

    const response = await publishPageEditorDraftsApi(pageId);

    if (!response.success) {
      setMessage(response.error.message ?? "Die Seite konnte nicht veröffentlicht werden.");
      return;
    }

    setDirty(false);
    setMessage(
      response.data.published > 0
        ? "Die Seite wurde veröffentlicht."
        : "Keine offenen Entwürfe zum Veröffentlichen.",
    );
    reloadPreview();
  };

  const discardDrafts = async () => {
    const response = await discardPageEditorDraftsApi(pageId);

    if (!response.success) {
      setMessage(response.error.message ?? "Entwürfe konnten nicht verworfen werden.");
      return;
    }

    setDirty(false);
    setMessage("Alle Entwürfe wurden verworfen.");
    reloadPreview();
  };

  const applyHistoryEntry = async (entry: HistoryEntry, direction: "undo" | "redo") => {
    const value = direction === "undo" ? entry.previous : entry.next;

    await savePageEditorDraftApi({
      pageId,
      textKey: entry.textKey,
      value,
    });

    reloadPreview();
  };

  const undo = async () => {
    const entry = undoStack[undoStack.length - 1];

    if (!entry) {
      return;
    }

    setUndoStack((stack) => stack.slice(0, -1));
    setRedoStack((stack) => [...stack, entry]);
    await applyHistoryEntry(entry, "undo");
  };

  const redo = async () => {
    const entry = redoStack[redoStack.length - 1];

    if (!entry) {
      return;
    }

    setRedoStack((stack) => stack.slice(0, -1));
    setUndoStack((stack) => [...stack, entry]);
    await applyHistoryEntry(entry, "redo");
  };

  const viewportWidth =
    viewport === "desktop" ? "100%" : viewport === "tablet" ? "768px" : "390px";

  const selected = elements.find((element) => element.textKey === selectedKey) ?? null;

  useEffect(() => {
    if (selected) {
      setEditDraft(selected.value);
    }
  }, [selected?.textKey, selected?.value]);

  if (!page) {
    return <p className="text-sm text-red-300">Seite nicht gefunden.</p>;
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-5rem)] max-w-[100rem] flex-col gap-3 p-4 sm:p-6">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-aw-border bg-aw-surface px-3 py-2">
        <Link
          href="/admin/inhalte/seiteneditor"
          className="rounded-md px-3 py-1.5 text-xs text-aw-cream ring-1 ring-aw-border"
        >
          Zur Seitenübersicht
        </Link>
        <span className="text-sm font-medium text-aw-cream">{page.name}</span>
        <span className="font-mono text-xs text-aw-muted">{page.path}</span>

        <div className="ml-auto flex flex-wrap gap-2">
          {(["desktop", "tablet", "mobile"] as ViewportMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewport(mode)}
              className={`rounded-md px-3 py-1.5 text-xs ${
                viewport === mode
                  ? "bg-aw-gold text-aw-bg"
                  : "text-aw-cream ring-1 ring-aw-border"
              }`}
            >
              {mode === "desktop" ? "Desktop" : mode === "tablet" ? "Tablet" : "Mobil"}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setEditMode((value) => !value)}
            className="rounded-md px-3 py-1.5 text-xs text-aw-cream ring-1 ring-aw-border"
          >
            Bearbeitung {editMode ? "an" : "aus"}
          </button>
          <button
            type="button"
            onClick={undo}
            disabled={undoStack.length === 0}
            className="rounded-md px-3 py-1.5 text-xs text-aw-cream ring-1 ring-aw-border disabled:opacity-40"
          >
            Rückgängig
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={redoStack.length === 0}
            className="rounded-md px-3 py-1.5 text-xs text-aw-cream ring-1 ring-aw-border disabled:opacity-40"
          >
            Wiederherstellen
          </button>
          <button
            type="button"
            onClick={() => void discardDrafts()}
            className="rounded-md px-3 py-1.5 text-xs text-aw-muted ring-1 ring-aw-border"
          >
            Entwürfe verwerfen
          </button>
          <button
            type="button"
            onClick={() => void publish()}
            className="rounded-md bg-aw-gold px-3 py-1.5 text-xs font-semibold text-aw-bg"
          >
            Veröffentlichen
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-aw-muted">
        <label>
          Vorschau als
          <select
            className="ml-2 rounded-md border border-aw-border bg-aw-bg px-2 py-1 text-aw-cream"
            value={previewRole}
            onChange={(event) => setPreviewRole(event.target.value as PreviewRole)}
          >
            <option value="guest">Gast</option>
            <option value="registered">Registrierter Benutzer</option>
            <option value="wurstclub">Wurstclub-Mitglied</option>
            <option value="meisterclub">Meisterclub-Mitglied</option>
            <option value="course_participant">Kursteilnehmer</option>
          </select>
        </label>
        {dirty && (
          <span className="text-aw-gold">Auf dieser Seite gibt es ungespeicherte Änderungen.</span>
        )}
        {message && <span className="text-aw-gold">{message}</span>}
      </div>

      {error && <p className="text-sm text-red-300">{error}</p>}

      <div className="flex min-h-0 flex-1 gap-3">
        <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-aw-border bg-aw-bg p-3">
          {loading ? (
            <p className="text-sm text-aw-muted">Editor wird vorbereitet …</p>
          ) : !frameUrl ? (
            <p className="text-sm text-aw-muted">Vorschau nicht verfügbar.</p>
          ) : (
            <div className="relative mx-auto transition-all" style={{ width: viewportWidth }}>
              {frameLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-aw-bg/80">
                  <p className="text-sm text-aw-muted">Vorschau wird geladen …</p>
                </div>
              )}
              <iframe
                key={frameUrl}
                ref={iframeRef}
                title={`Editor-Vorschau: ${page.name}`}
                src={frameUrl}
                onLoad={() => setFrameLoading(false)}
                className="min-h-[480px] h-[calc(100vh-12rem)] w-full rounded-lg border border-aw-border bg-white"
              />
            </div>
          )}
        </div>

        <aside
          className={`${
            sidebarOpen ? "w-80" : "w-10"
          } shrink-0 overflow-hidden rounded-xl border border-aw-border bg-aw-surface transition-all`}
        >
          <button
            type="button"
            className="w-full px-3 py-2 text-left text-xs text-aw-muted"
            onClick={() => setSidebarOpen((value) => !value)}
          >
            {sidebarOpen ? "Sidebar einklappen" : "»"}
          </button>

          {sidebarOpen && (
            <div className="space-y-4 px-3 pb-4 text-sm">
              <section>
                <h3 className="font-semibold text-aw-cream">Inhalt</h3>
                {selected ? (
                  <div className="mt-2 space-y-3">
                    <p className="text-aw-cream">{selected.label}</p>

                    <label className="block text-xs text-aw-muted">
                      {selected.elementType === "image" ? "Bild-URL bearbeiten" : "Text bearbeiten"}
                      {selected.elementType === "image" ? (
                        <input
                          className="mt-1 w-full rounded-md border border-aw-border bg-aw-bg px-3 py-2 text-sm text-aw-cream"
                          value={editDraft}
                          onChange={(event) => setEditDraft(event.target.value)}
                          placeholder="/pfad/zum/bild.png"
                        />
                      ) : (
                        <textarea
                          className="mt-1 w-full rounded-md border border-aw-border bg-aw-bg px-3 py-2 text-sm text-aw-cream"
                          rows={selected.elementType === "rich" ? 6 : 3}
                          value={editDraft}
                          onChange={(event) => setEditDraft(event.target.value)}
                        />
                      )}
                    </label>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={savingDraft || !editMode}
                        onClick={() => void saveSelectedDraft()}
                        className="rounded-md bg-aw-gold px-3 py-1.5 text-xs font-semibold text-aw-bg disabled:opacity-50"
                      >
                        {savingDraft ? "Speichern …" : "Entwurf speichern"}
                      </button>
                      <button
                        type="button"
                        disabled={savingDraft}
                        onClick={() => setEditDraft(selected.value)}
                        className="rounded-md px-3 py-1.5 text-xs text-aw-cream ring-1 ring-aw-border disabled:opacity-50"
                      >
                        Zurücksetzen
                      </button>
                    </div>

                    <div className="space-y-1 text-xs text-aw-muted">
                      <p>Veröffentlicht: {selected.publishedValue}</p>
                      <p>Standard: {selected.defaultValue}</p>
                      <p>Zeichen: {editDraft.length}</p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-aw-muted">
                    Klicke in der Vorschau auf einen markierten Bereich (goldener
                    Rahmen beim Darüberfahren) oder wähle ein Element in der Liste.
                  </p>
                )}
              </section>

              <section>
                <h3 className="font-semibold text-aw-cream">Elemente ({elements.length})</h3>
                <ul className="mt-2 max-h-48 space-y-1 overflow-auto text-xs text-aw-muted">
                  {elements.map((element) => (
                    <li key={element.textKey}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedKey(element.textKey);
                          setEditDraft(element.value);
                        }}
                        className={`w-full rounded px-2 py-1 text-left ${
                          selectedKey === element.textKey
                            ? "bg-aw-gold/15 text-aw-gold"
                            : "hover:bg-aw-surface-2"
                        }`}
                      >
                        {element.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>

              <details className="text-xs text-aw-muted">
                <summary className="cursor-pointer font-semibold text-aw-cream">Technik</summary>
                {selected && (
                  <div className="mt-2 space-y-1 font-mono">
                    <p>{selected.textKey}</p>
                    <p>{selected.category}</p>
                    <p>{selected.pagePath}</p>
                  </div>
                )}
              </details>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
