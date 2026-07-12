import Link from "next/link";

import Icon from "@/components/brand/Icon";
import PlatformImage from "@/components/platform-text/PlatformImage";
import PlatformText from "@/components/platform-text/PlatformText";
import { isPageEditorPreviewActive } from "@/lib/page-editor/page-editor-preview";
import { getPlatformText } from "@/lib/platform-text/platform-text-service";
import type { PhilosophyCardDefinition } from "@/lib/philosophy/philosophy-cards";

type PhilosophyCardProps = {
  card: PhilosophyCardDefinition;
  caption?: string | null;
};

/**
 * Einzelne Philosophie-Karte mit administrierbarem Bild, Alt-Text und optionaler Bildunterschrift.
 */
export default async function PhilosophyCard({ card, caption }: PhilosophyCardProps) {
  const editorActive = await isPageEditorPreviewActive();
  const showCaption = editorActive || Boolean(caption?.trim());

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-aw-border bg-aw-surface/80 transition-colors hover:border-aw-gold/35">
      <figure>
        <div className="relative aspect-[4/3] overflow-hidden bg-aw-surface-2">
          <PlatformImage
            textKey={card.imageKey}
            altKey={card.imageAltKey}
            fallback={card.defaultImage}
            altFallback={card.defaultAlt}
            label={`Philosophie — ${card.defaultTitle}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-aw-bg/50 via-transparent to-transparent" />
        </div>

        {showCaption ? (
          <figcaption className="border-b border-aw-border/60 px-4 py-2 text-xs text-aw-muted">
            <PlatformText
              textKey={card.captionKey}
              fallback={card.defaultCaption}
              elementType="text"
              as="span"
            />
          </figcaption>
        ) : null}
      </figure>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-aw-gold/10 text-aw-gold ring-1 ring-aw-gold/20">
          <Icon name={card.icon} className="h-5 w-5" />
        </span>
        <span
          aria-hidden="true"
          className="mt-4 font-display text-2xl font-bold text-aw-gold/20"
        >
          {String(card.index).padStart(2, "0")}
        </span>
        <h2 className="mt-1 font-display text-xl font-bold leading-snug text-aw-cream">
          <PlatformText
            textKey={card.titleKey}
            fallback={card.defaultTitle}
            elementType="heading"
            as="span"
          />
        </h2>
        <PlatformText
          textKey={card.descriptionKey}
          fallback={card.defaultDescription}
          elementType="text"
          as="p"
          className="mt-3 flex-1 text-sm leading-7 text-aw-muted"
        />
      </div>
    </article>
  );
}

export async function resolvePhilosophyCardCaption(
  card: PhilosophyCardDefinition,
): Promise<string | null> {
  const value = await getPlatformText(card.captionKey, card.defaultCaption);
  return value.trim() ? value : null;
}
