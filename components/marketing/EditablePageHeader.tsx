import type { ReactNode } from "react";

import PlatformImage from "@/components/platform-text/PlatformImage";
import PlatformText from "@/components/platform-text/PlatformText";
import {
  getPlatformText,
  getPlatformTextForEditor,
} from "@/lib/platform-text/platform-text-service";
import {
  isPageEditorPreviewActive,
} from "@/lib/page-editor/page-editor-preview";

import PageHeader from "./PageHeader";

type EditablePageHeaderProps = {
  eyebrowKey?: string;
  titleKey: string;
  descriptionKey?: string;
  imageKey?: string;
  imageAltKey?: string;
  fallbacks?: {
    eyebrow?: string;
    title?: string;
    description?: string;
    image?: string;
    imageAlt?: string;
  };
  /** Statisches Bild, wenn kein bearbeitbarer Bildschlüssel gesetzt ist */
  imageSrc?: string;
  imageAlt?: string;
};

/**
 * Seitenkopf mit bearbeitbaren Texten und optionalem Header-Bild für den Seiteneditor.
 */
export default async function EditablePageHeader({
  eyebrowKey,
  titleKey,
  descriptionKey,
  imageKey,
  imageAltKey,
  fallbacks = {},
  imageSrc,
  imageAlt,
}: EditablePageHeaderProps) {
  const editorActive = await isPageEditorPreviewActive();

  let resolvedImageSrc = imageSrc;
  let backgroundImage: ReactNode;

  if (imageKey) {
    const imageValue = editorActive
      ? await getPlatformTextForEditor(imageKey, fallbacks.image ?? "")
      : await getPlatformText(imageKey, fallbacks.image ?? "");

    if (imageValue || editorActive) {
      backgroundImage = (
        <PlatformImage
          textKey={imageKey}
          altKey={imageAltKey}
          fallback={fallbacks.image ?? ""}
          altFallback={fallbacks.imageAlt ?? ""}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      );
    }

    resolvedImageSrc = undefined;
  }

  const imageAltText = imageAltKey
    ? editorActive
      ? await getPlatformTextForEditor(imageAltKey, fallbacks.imageAlt ?? "")
      : await getPlatformText(imageAltKey, fallbacks.imageAlt ?? "")
    : imageAlt;

  return (
    <PageHeader
      eyebrow={
        eyebrowKey ? (
          <PlatformText textKey={eyebrowKey} fallback={fallbacks.eyebrow} elementType="subheading" as="span" />
        ) : (
          fallbacks.eyebrow
        )
      }
      title={
        <PlatformText textKey={titleKey} fallback={fallbacks.title} elementType="heading" as="span" />
      }
      description={
        descriptionKey ? (
          <PlatformText textKey={descriptionKey} fallback={fallbacks.description} elementType="text" as="span" />
        ) : (
          fallbacks.description
        )
      }
      imageSrc={resolvedImageSrc}
      imageAlt={imageAltText}
      backgroundImage={backgroundImage}
    />
  );
}
