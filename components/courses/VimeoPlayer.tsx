"use client";

/**
 * @file VimeoPlayer.tsx
 * @purpose Responsives Vimeo-Embed ohne direkten Video-Link in der UI.
 */

type VimeoPlayerProps = {
  embedUrl: string;
  title: string;
};

export default function VimeoPlayer({ embedUrl, title }: VimeoPlayerProps) {
  if (!embedUrl) {
    return (
      <p className="rounded-lg border border-aw-border bg-aw-surface p-6 text-sm text-aw-muted">
        Kein Video hinterlegt.
      </p>
    );
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-aw-border bg-black">
      <iframe
        src={embedUrl}
        title={title}
        className="absolute inset-0 h-full w-full"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
