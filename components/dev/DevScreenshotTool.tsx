"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Point = { x: number; y: number };
type Rect = { x: number; y: number; width: number; height: number };

function normalizeRect(start: Point, end: Point): Rect {
  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);

  return { x, y, width, height };
}

async function captureRegion(rect: Rect): Promise<void> {
  const html2canvas = (await import("html2canvas")).default;
  const scale = window.devicePixelRatio || 1;

  const fullCanvas = await html2canvas(document.documentElement, {
    useCORS: true,
    backgroundColor: null,
    scale,
    scrollX: 0,
    scrollY: -window.scrollY,
    windowWidth: document.documentElement.clientWidth,
    windowHeight: document.documentElement.clientHeight,
    ignoreElements: (element) =>
      element instanceof HTMLElement && element.dataset.screenshotUi === "true",
  });

  const cropCanvas = document.createElement("canvas");
  cropCanvas.width = Math.max(1, Math.round(rect.width * scale));
  cropCanvas.height = Math.max(1, Math.round(rect.height * scale));

  const context = cropCanvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas nicht verfügbar.");
  }

  const sourceX = Math.round((rect.x + window.scrollX) * scale);
  const sourceY = Math.round((rect.y + window.scrollY) * scale);
  const sourceWidth = Math.round(rect.width * scale);
  const sourceHeight = Math.round(rect.height * scale);

  context.drawImage(
    fullCanvas,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    cropCanvas.width,
    cropCanvas.height,
  );

  const blob = await new Promise<Blob | null>((resolve) => {
    cropCanvas.toBlob(resolve, "image/png");
  });

  if (!blob) {
    throw new Error("Screenshot konnte nicht erstellt werden.");
  }

  const fileName = `alles-wurst-bereich-${new Date().toISOString().replace(/[:.]/g, "-")}.png`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);

  if (navigator.clipboard && "ClipboardItem" in window) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
    } catch {
      // Zwischenablage ist optional.
    }
  }
}

export default function DevScreenshotTool() {
  const [selecting, setSelecting] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const beginSelection = useCallback(() => {
    if (busy) {
      return;
    }

    setSelecting(true);
    setStartPoint(null);
    setCurrentPoint(null);
    setStatus("Ziehe mit der Maus den gewünschten Bereich auf. Esc zum Abbrechen.");
  }, [busy]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelecting(false);
        setStartPoint(null);
        setCurrentPoint(null);
        setStatus(null);
        return;
      }

      if (event.key === "PrintScreen" || event.code === "PrintScreen") {
        event.preventDefault();
        event.stopPropagation();
        beginSelection();
      }
    };

    window.addEventListener("keydown", onKeyDown, true);

    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [beginSelection]);

  const selectionRect =
    startPoint && currentPoint ? normalizeRect(startPoint, currentPoint) : null;

  async function finishSelection(rect: Rect) {
    if (rect.width < 8 || rect.height < 8) {
      setStatus("Bereich zu klein. Bitte erneut aufziehen.");
      setSelecting(false);
      return;
    }

    setBusy(true);
    setStatus("Screenshot wird erstellt …");

    try {
      await captureRegion(rect);
      setStatus("Screenshot gespeichert und in die Zwischenablage kopiert.");
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Screenshot fehlgeschlagen.",
      );
    } finally {
      setBusy(false);
      setSelecting(false);
      setStartPoint(null);
      setCurrentPoint(null);
    }
  }

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <>
      <div
        className="fixed bottom-4 left-4 z-[10000] flex max-w-xs flex-col gap-2"
        data-screenshot-ui="true"
      >
        <button
          type="button"
          onClick={beginSelection}
          disabled={busy || selecting}
          className="rounded-lg border border-aw-gold/60 bg-aw-surface px-3 py-2 text-left text-xs font-semibold text-aw-cream shadow-lg hover:border-aw-gold disabled:opacity-50"
        >
          Bereich aufnehmen
          <span className="mt-0.5 block font-normal text-aw-muted">
            Druck-Taste oder hier klicken
          </span>
        </button>
        {status && (
          <p className="rounded-lg border border-aw-border bg-aw-surface/95 px-3 py-2 text-xs text-aw-muted">
            {status}
          </p>
        )}
      </div>

      {selecting && (
        <div
          ref={overlayRef}
          data-screenshot-ui="true"
          className="fixed inset-0 z-[9999] cursor-crosshair bg-black/20"
          onMouseDown={(event) => {
            setStartPoint({ x: event.clientX, y: event.clientY });
            setCurrentPoint({ x: event.clientX, y: event.clientY });
          }}
          onMouseMove={(event) => {
            if (!startPoint) {
              return;
            }

            setCurrentPoint({ x: event.clientX, y: event.clientY });
          }}
          onMouseUp={(event) => {
            if (!startPoint) {
              setSelecting(false);
              return;
            }

            const endPoint = { x: event.clientX, y: event.clientY };
            const rect = normalizeRect(startPoint, endPoint);
            void finishSelection(rect);
          }}
        >
          {selectionRect && selectionRect.width > 0 && selectionRect.height > 0 && (
            <div
              className="pointer-events-none absolute border-2 border-aw-gold bg-aw-gold/10 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]"
              style={{
                left: selectionRect.x,
                top: selectionRect.y,
                width: selectionRect.width,
                height: selectionRect.height,
              }}
            />
          )}
        </div>
      )}
    </>
  );
}
