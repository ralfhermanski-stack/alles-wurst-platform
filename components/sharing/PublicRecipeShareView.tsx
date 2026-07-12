import Image from "next/image";

import type { PublicRecipeShareView as PublicRecipeShareViewData } from "@/lib/sharing/share-types";

type Props = {
  data: PublicRecipeShareViewData;
  shareUrl: string;
  ogImageUrl: string;
};

export default function PublicRecipeShareView({ data, shareUrl, ogImageUrl }: Props) {
  return (
    <div className="min-h-screen bg-aw-bg px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <article className="overflow-hidden rounded-2xl border border-aw-border bg-aw-surface shadow-lg">
          {data.imageUrl ? (
            <div className="relative aspect-[16/9] w-full bg-aw-bg">
              <Image
                src={data.imageUrl}
                alt={data.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 768px"
                unoptimized
              />
            </div>
          ) : null}

          <div className="p-8">
            <p className="text-xs uppercase tracking-wide text-aw-gold">
              {data.category ?? "Eigenes Rezept"}
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold text-aw-cream">{data.title}</h1>
            <p className="mt-2 text-sm text-aw-muted">
              von {data.authorName} · {new Date(data.createdAt).toLocaleDateString("de-DE")}
            </p>

            {data.description ? (
              <p className="mt-6 text-aw-cream/90">{data.description}</p>
            ) : null}

            {data.ingredients?.length ? (
              <section className="mt-8">
                <h2 className="font-semibold text-aw-cream">Zutaten</h2>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-aw-muted">
                  {data.ingredients.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {data.instructions ? (
              <section className="mt-8">
                <h2 className="font-semibold text-aw-cream">Herstellung</h2>
                <p className="mt-3 whitespace-pre-wrap text-sm text-aw-muted">{data.instructions}</p>
              </section>
            ) : null}
          </div>
        </article>

        <p className="mt-6 text-center text-xs text-aw-muted">
          Geteilt über ALLES WURST ·{" "}
          <a href={shareUrl} className="text-aw-gold">
            {shareUrl}
          </a>
        </p>
        <meta property="og:image" content={ogImageUrl} />
      </div>
    </div>
  );
}
