/**
 * @file PlatformText.tsx
 */

import type { ElementType } from "react";

import {
  getPlatformText,
  getPlatformTextForEditor,
  getPlatformTextRecord,
} from "@/lib/platform-text/platform-text-service";
import { getPlatformTextDefault } from "@/lib/platform-text/platform-text-defaults";
import {
  getPageEditorPreviewPageId,
  isPageEditorPreviewActive,
} from "@/lib/page-editor/page-editor-preview";
import type { EditableElementType } from "@/lib/page-editor/page-editor-types";

import PlatformTextClient from "./PlatformTextClient";

type PlatformTextProps = {
  textKey: string;
  fallback?: string;
  label?: string;
  elementType?: EditableElementType;
  as?: ElementType;
  className?: string;
  showKey?: boolean;
};

export default async function PlatformText({
  textKey,
  fallback,
  label,
  elementType = "text",
  as = "span",
  className,
  showKey = false,
}: PlatformTextProps) {
  const editorActive = await isPageEditorPreviewActive();
  const pageId = editorActive ? await getPageEditorPreviewPageId() : null;

  if (!editorActive || !pageId) {
    const value = await getPlatformText(textKey, fallback);
    const Tag = as;
    return <Tag className={className}>{value}</Tag>;
  }

  const [editorValue, recordResult] = await Promise.all([
    getPlatformTextForEditor(textKey, fallback),
    getPlatformTextRecord(textKey),
  ]);

  const registry = getPlatformTextDefault(textKey);
  const publishedValue =
    recordResult.success ? recordResult.data.value : registry?.defaultValue ?? fallback ?? "";
  const defaultValue =
    recordResult.success ? recordResult.data.defaultValue : registry?.defaultValue ?? fallback ?? "";
  const displayLabel =
    label ?? (recordResult.success ? recordResult.data.label ?? textKey : registry?.label ?? textKey);

  return (
    <PlatformTextClient
      textKey={textKey}
      label={displayLabel}
      elementType={elementType}
      value={editorValue}
      publishedValue={publishedValue}
      defaultValue={defaultValue}
      maxLength={null}
      allowRichText={elementType === "rich"}
      pageId={pageId}
      as={as}
      className={className}
      showKey={showKey}
    />
  );
}
