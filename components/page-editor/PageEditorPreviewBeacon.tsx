"use client";

/**
 * @file PageEditorPreviewBeacon.tsx
 * @purpose Meldet dem Seiteneditor, wenn die Vorschau im iframe geladen ist.
 */

import { useEffect } from "react";

export default function PageEditorPreviewBeacon() {
  useEffect(() => {
    if (window.self === window.top) {
      return;
    }

    window.parent.postMessage(
      { source: "aw-page-editor", type: "preview_ready" },
      window.location.origin,
    );
  }, []);

  return null;
}
