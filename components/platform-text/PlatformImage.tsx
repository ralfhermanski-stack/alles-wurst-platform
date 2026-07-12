/**
 * @file PlatformImage.tsx
 */

import Image from "next/image";

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

import PlatformImageClient from "./PlatformImageClient";

type PlatformImageProps = {
  textKey: string;
  altKey?: string;
  fallback?: string;
  altFallback?: string;
  label?: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  className?: string;
  sizes?: string;
};

export default async function PlatformImage({
  textKey,
  altKey,
  fallback = "",
  altFallback = "",
  label,
  width,
  height,
  fill,
  priority,
  className,
  sizes,
}: PlatformImageProps) {
  const editorActive = await isPageEditorPreviewActive();
  const pageId = editorActive ? await getPageEditorPreviewPageId() : null;

  const src = editorActive
    ? await getPlatformTextForEditor(textKey, fallback)
    : await getPlatformText(textKey, fallback);

  const alt = altKey
    ? editorActive
      ? await getPlatformTextForEditor(altKey, altFallback)
      : await getPlatformText(altKey, altFallback)
    : altFallback;

  if (!src && !editorActive) {
    return null;
  }

  if (editorActive && pageId) {
    const record = await getPlatformTextRecord(textKey);
    const registry = getPlatformTextDefault(textKey);
    const displayLabel =
      label ?? (record.success ? record.data.label ?? textKey : registry?.label ?? textKey);

    return (
      <PlatformImageClient
        textKey={textKey}
        altKey={altKey}
        label={displayLabel}
        pageId={pageId}
        src={src}
        alt={alt}
        width={width}
        height={height}
        fill={fill}
        priority={priority}
        className={className}
        sizes={sizes}
      />
    );
  }

  if (fill) {
    return (
      <div className="absolute inset-0">
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes}
          className={className}
        />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width ?? 1200}
      height={height ?? 800}
      priority={priority}
      className={className}
    />
  );
}
