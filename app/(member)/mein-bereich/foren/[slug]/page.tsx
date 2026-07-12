"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import ForumComposer from "@/components/forums/ForumComposer";
import ForumThreadList from "@/components/forums/ForumThreadList";
import type { ForumThreadEntry } from "@/lib/forums/forum-types";
import {
  inputClassName,
  primaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

export default function MemberForumPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const router = useRouter();
  const [slug, setSlug] = useState<string | null>(null);
  const [forum, setForum] = useState<{
    title: string;
    description: string | null;
    courseTitle: string | null;
    courseSlug: string | null;
    canWrite: boolean;
  } | null>(null);
  const [threads, setThreads] = useState<ForumThreadEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [creating, setCreating] = useState(false);

  async function loadForumData(forumSlug: string) {
    const [forumResponse, threadsResponse] = await Promise.all([
      fetch(`/api/forums/${forumSlug}`, { credentials: "include" }),
      fetch(`/api/forums/${forumSlug}/threads`, { credentials: "include" }),
    ]);

    const forumData = (await forumResponse.json()) as {
      success: boolean;
      data?: {
        title: string;
        description: string | null;
        courseTitle: string | null;
        courseSlug: string | null;
        canWrite: boolean;
      };
      error?: { message: string };
    };

    if (!forumData.success || !forumData.data) {
      setError("Forum nicht gefunden.");
      setForum(null);
      return;
    }

    const threadsData = (await threadsResponse.json()) as {
      success: boolean;
      data?: ForumThreadEntry[];
    };

    setError(null);
    setForum(forumData.data);
    setThreads(threadsData.success ? (threadsData.data ?? []) : []);
  }

  useEffect(() => {
    void (async () => {
      const resolved = await params;
      setSlug(resolved.slug);
      await loadForumData(resolved.slug);
    })();
  }, [params]);

  async function handleCreateThread() {
    if (!slug || !newTitle.trim() || !newBody.trim()) {
      return;
    }

    setCreating(true);

    const response = await fetch(`/api/forums/${slug}/threads`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle.trim(), body: newBody.trim() }),
    });

    const data = (await response.json()) as {
      success: boolean;
      data?: ForumThreadEntry;
    };

    setCreating(false);

    if (!data.success || !data.data) {
      setError("Thema konnte nicht erstellt werden.");
      return;
    }

    setNewTitle("");
    setNewBody("");
    router.push(`/mein-bereich/foren/${slug}/${data.data.slug}`);
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
        <Link href="/mein-bereich/kurse" className="mt-4 inline-block text-aw-gold">
          Zurück zu meinen Kursen
        </Link>
      </div>
    );
  }

  if (!forum || !slug) {
    return <p className="p-8 text-sm text-aw-muted">Forum wird geladen …</p>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      {forum.courseSlug && (
        <Link
          href={`/mein-bereich/kurse/${forum.courseSlug}`}
          className="text-sm text-aw-gold"
        >
          ← Zurück zum Kurs{forum.courseTitle ? `: ${forum.courseTitle}` : ""}
        </Link>
      )}

      <h1 className="mt-4 font-display text-3xl font-bold text-aw-cream">
        {forum.title}
      </h1>

      {forum.description && (
        <p className="mt-4 text-sm leading-relaxed text-aw-muted">
          {forum.description}
        </p>
      )}

      <div className="mt-8 space-y-6">
        <ForumThreadList forumSlug={slug} threads={threads} />

        {forum.canWrite && (
          <section className="rounded-xl border border-aw-border bg-aw-surface/40 p-5">
            <h2 className="font-display text-lg font-bold text-aw-cream">
              Neues Thema
            </h2>
            <div className="mt-4 space-y-3">
              <input
                className={inputClassName}
                placeholder="Titel"
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
              />
              <textarea
                className={`${inputClassName} min-h-28 w-full`}
                placeholder="Dein Beitrag …"
                value={newBody}
                onChange={(event) => setNewBody(event.target.value)}
              />
              <button
                type="button"
                className={primaryButtonClassName}
                disabled={creating || !newTitle.trim() || !newBody.trim()}
                onClick={() => void handleCreateThread()}
              >
                {creating ? "Wird erstellt …" : "Thema erstellen"}
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
