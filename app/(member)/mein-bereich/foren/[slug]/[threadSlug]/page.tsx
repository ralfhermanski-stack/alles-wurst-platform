"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import ForumAuthor from "@/components/forums/ForumAuthor";
import ForumComposer from "@/components/forums/ForumComposer";
import ForumPostSignature from "@/components/forums/ForumPostSignature";
import ForumRulesAcceptanceModal from "@/components/forums/ForumRulesAcceptanceModal";
import type { ForumThreadDetail } from "@/lib/forums/forum-types";
import { useForumRulesAcceptance } from "@/lib/forums/use-forum-rules-acceptance";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("de-DE");
}

export default function MemberForumThreadPage({
  params,
}: {
  params: Promise<{ slug: string; threadSlug: string }>;
}) {
  const [slug, setSlug] = useState<string | null>(null);
  const [threadSlug, setThreadSlug] = useState<string | null>(null);
  const [thread, setThread] = useState<ForumThreadDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const rules = useForumRulesAcceptance(Boolean(slug && thread));

  async function loadThread(forumSlug: string, topicSlug: string) {
    const response = await fetch(
      `/api/forums/${forumSlug}/threads/${topicSlug}`,
      { credentials: "include" },
    );

    const data = (await response.json()) as {
      success: boolean;
      data?: ForumThreadDetail;
    };

    if (!data.success || !data.data) {
      setError("Thema nicht gefunden.");
      setThread(null);
      return;
    }

    setError(null);
    setThread(data.data);
  }

  useEffect(() => {
    void (async () => {
      const resolved = await params;
      setSlug(resolved.slug);
      setThreadSlug(resolved.threadSlug);
      await loadThread(resolved.slug, resolved.threadSlug);
    })();
  }, [params]);

  async function handleReply(body: string): Promise<boolean> {
    if (!slug || !threadSlug || rules.needsAcceptance) {
      return false;
    }

    const response = await fetch(
      `/api/forums/${slug}/threads/${threadSlug}/posts`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      },
    );

    const data = (await response.json()) as {
      success: boolean;
      error?: { code?: string };
    };

    if (!data.success) {
      if (data.error?.code === "FORUM_RULES_REQUIRED") {
        await rules.refresh();
      }
      return false;
    }

    await loadThread(slug, threadSlug);
    return true;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="font-display text-2xl font-bold text-aw-cream">
          Seite nicht gefunden
        </h1>
        <p className="mt-3 text-sm text-aw-muted">
          Diese Seite ist nicht verfügbar.
        </p>
        {slug && (
          <Link
            href={`/mein-bereich/foren/${slug}`}
            className="mt-4 inline-block text-aw-gold"
          >
            Zurück zum Forum
          </Link>
        )}
      </div>
    );
  }

  if (!thread || !slug) {
    return <p className="p-8 text-sm text-aw-muted">Thema wird geladen …</p>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      {rules.status && thread.canWrite && (
        <ForumRulesAcceptanceModal
          open={rules.needsAcceptance}
          status={rules.status}
          submitting={rules.submitting}
          onAccept={async () => {
            await rules.accept();
          }}
        />
      )}

      <Link
        href={`/mein-bereich/foren/${slug}`}
        className="text-sm text-aw-gold"
      >
        ← Zurück zum Forum
      </Link>

      <article className="mt-4 rounded-xl border border-aw-border bg-aw-surface/40 p-5">
        <h1 className="font-display text-2xl font-bold text-aw-cream">
          {thread.title}
        </h1>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <ForumAuthor author={thread.author} size="md" />
          <time className="text-xs text-aw-muted">
            {formatDate(thread.createdAt)}
          </time>
        </div>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-aw-cream">
          {thread.body}
        </p>
        {thread.forumSignature && (
          <ForumPostSignature html={thread.forumSignature} />
        )}
      </article>

      <section className="mt-8 space-y-4">
        <h2 className="font-display text-lg font-bold text-aw-cream">
          Antworten ({thread.posts.length})
        </h2>

        {thread.posts.map((post) => (
          <article
            key={post.id}
            className="rounded-xl border border-aw-border bg-aw-bg/40 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <ForumAuthor author={post.author} size="md" />
              <time className="text-xs text-aw-muted">
                {formatDate(post.createdAt)}
              </time>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-aw-cream">
              {post.body}
            </p>
            {post.forumSignature && (
              <ForumPostSignature html={post.forumSignature} />
            )}
          </article>
        ))}
      </section>

      {thread.canWrite && (
        <section className="mt-8">
          <h2 className="mb-3 font-display text-lg font-bold text-aw-cream">
            Antwort schreiben
          </h2>
          {rules.needsAcceptance ? (
            <p className="text-sm text-aw-muted">
              Bitte akzeptiere zuerst die Forenregeln im Dialog, um zu antworten.{" "}
              <Link href="/forenregeln" className="text-aw-gold underline">
                Regeln lesen
              </Link>
            </p>
          ) : (
            <ForumComposer
              placeholder="Deine Antwort …"
              submitLabel="Antwort senden"
              onSubmit={handleReply}
            />
          )}
        </section>
      )}
    </div>
  );
}
