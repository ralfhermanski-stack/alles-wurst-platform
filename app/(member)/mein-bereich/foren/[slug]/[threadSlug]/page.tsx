"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import ForumComposer from "@/components/forums/ForumComposer";
import ForumPost from "@/components/forums/ForumPost";
import ForumRulesAcceptanceModal from "@/components/forums/ForumRulesAcceptanceModal";
import type { ForumThreadDetail } from "@/lib/forums/forum-types";
import { useForumRulesAcceptance } from "@/lib/forums/use-forum-rules-acceptance";

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
      <div className="mx-auto max-w-4xl px-4 py-8">
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
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
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

      <header className="mt-3 border-b border-aw-border pb-3">
        <h1 className="font-display text-xl font-bold leading-snug text-aw-cream sm:text-2xl">
          {thread.title}
        </h1>
        <p className="mt-1 text-xs text-aw-muted">
          {thread.posts.length} Antwort{thread.posts.length === 1 ? "" : "en"}
        </p>
      </header>

      <div className="mt-3 overflow-hidden rounded-lg border border-aw-border bg-aw-bg/20">
        <ForumPost
          author={thread.author}
          body={thread.body}
          createdAt={thread.createdAt}
          forumSignature={thread.forumSignature}
        />

        {thread.posts.map((post) => (
          <ForumPost
            key={post.id}
            author={post.author}
            body={post.body}
            createdAt={post.createdAt}
            forumSignature={post.forumSignature}
          />
        ))}
      </div>

      {thread.canWrite && (
        <section className="mt-5">
          <h2 className="mb-2 text-sm font-semibold text-aw-cream">
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
