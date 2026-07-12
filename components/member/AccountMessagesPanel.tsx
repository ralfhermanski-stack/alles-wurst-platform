"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { secondaryButtonClassName } from "@/components/tools/recipe-generator/recipe-form-classes";

export type AccountMessageItem = {
  id: string;
  messageType: string;
  title: string;
  body: string;
  linkUrl: string | null;
  readAt: string | null;
  createdAt: string;
};

type AccountMessagesPanelProps = {
  compact?: boolean;
  limit?: number;
};

export default function AccountMessagesPanel({
  compact = false,
  limit,
}: AccountMessagesPanelProps) {
  const [messages, setMessages] = useState<AccountMessageItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 15_000);

      const response = await fetch("/api/account/messages", {
        credentials: "include",
        signal: controller.signal,
      });

      window.clearTimeout(timeout);

      const json = (await response.json()) as {
        success: boolean;
        data?: { messages: AccountMessageItem[]; unreadCount: number };
        error?: { message: string };
      };

      if (!json.success || !json.data) {
        setError(json.error?.message ?? "Nachrichten konnten nicht geladen werden.");
        return;
      }

      setMessages(
        limit ? json.data.messages.slice(0, limit) : json.data.messages,
      );
      setUnreadCount(json.data.unreadCount);
    } catch {
      setError("Nachrichten konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  async function markRead(messageId: string) {
    await fetch(`/api/account/messages/${messageId}/read`, {
      method: "POST",
      credentials: "include",
    });

    setMessages((current) =>
      current.map((message) =>
        message.id === messageId
          ? { ...message, readAt: new Date().toISOString() }
          : message,
      ),
    );
    setUnreadCount((current) => Math.max(0, current - 1));
  }

  if (loading) {
    return <p className="text-sm text-aw-muted">Nachrichten werden geladen …</p>;
  }

  if (error) {
    return <p className="text-sm text-aw-warning">{error}</p>;
  }

  const visibleMessages = messages;

  return (
    <div className="space-y-4">
      {!compact && unreadCount > 0 && (
        <p className="text-sm text-aw-gold">
          {unreadCount} ungelesene {unreadCount === 1 ? "Nachricht" : "Nachrichten"}
        </p>
      )}

      {visibleMessages.length === 0 ? (
        <p className="text-sm text-aw-muted">
          Noch keine Nachrichten. Hier erscheinen Bestätigungen zu Widerrufen,
          Datenexporten und anderen Konto-Vorgängen.
        </p>
      ) : (
        <ul className="space-y-3">
          {visibleMessages.map((message) => {
            const unread = !message.readAt;

            return (
              <li
                key={message.id}
                className={`rounded-xl border px-4 py-4 ${
                  unread
                    ? "border-aw-gold/40 bg-aw-gold/5"
                    : "border-aw-border bg-aw-surface"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-aw-cream">{message.title}</p>
                    <p className="mt-1 text-xs text-aw-muted">
                      {new Date(message.createdAt).toLocaleString("de-DE")}
                      {unread && (
                        <span className="ml-2 rounded bg-aw-gold/20 px-1.5 py-0.5 text-aw-gold">
                          Neu
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm text-aw-muted">
                  {message.body}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {message.linkUrl && (
                    <Link
                      href={message.linkUrl}
                      onClick={() => void markRead(message.id)}
                      className={secondaryButtonClassName}
                    >
                      Details öffnen
                    </Link>
                  )}
                  {unread && (
                    <button
                      type="button"
                      onClick={() => void markRead(message.id)}
                      className="text-sm text-aw-muted hover:text-aw-cream"
                    >
                      Als gelesen markieren
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {compact && messages.length > 0 && (
        <Link
          href="/mein-bereich/nachrichten"
          className="inline-block text-sm text-aw-gold hover:underline"
        >
          Alle Nachrichten anzeigen
          {unreadCount > 0 ? ` (${unreadCount} neu)` : ""}
        </Link>
      )}
    </div>
  );
}
