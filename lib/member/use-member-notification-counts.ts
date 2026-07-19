"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type UnreadCountResponse = {
  success: boolean;
  data?: { unreadCount: number };
};

/**
 * Lädt ungelesene Nachrichten, Support-Antworten und Forum-Aktivität für Badges.
 */
export function useMemberNotificationCounts(enabled = true) {
  const pathname = usePathname();
  const [messageUnreadCount, setMessageUnreadCount] = useState(0);
  const [supportUnreadCount, setSupportUnreadCount] = useState(0);
  const [forumUnreadCount, setForumUnreadCount] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setMessageUnreadCount(0);
      setSupportUnreadCount(0);
      setForumUnreadCount(0);
      return;
    }

    void Promise.all([
      fetch("/api/account/messages/unread-count", { credentials: "include" }).then(
        (response) => response.json() as Promise<UnreadCountResponse>,
      ),
      fetch("/api/support/unread-count", { credentials: "include" }).then(
        (response) => response.json() as Promise<UnreadCountResponse>,
      ),
      fetch("/api/forums/unread-count", { credentials: "include" }).then(
        (response) => response.json() as Promise<UnreadCountResponse>,
      ),
    ])
      .then(([messagesJson, supportJson, forumJson]) => {
        if (messagesJson.success && messagesJson.data) {
          setMessageUnreadCount(messagesJson.data.unreadCount);
        }

        if (supportJson.success && supportJson.data) {
          setSupportUnreadCount(supportJson.data.unreadCount);
        }

        if (forumJson.success && forumJson.data) {
          setForumUnreadCount(forumJson.data.unreadCount);
        }
      })
      .catch(() => {
        // Badges sind optional — Fehler still ignorieren.
      });
  }, [pathname, enabled]);

  const totalUnreadCount =
    messageUnreadCount + supportUnreadCount + forumUnreadCount;

  return {
    messageUnreadCount,
    supportUnreadCount,
    forumUnreadCount,
    totalUnreadCount,
  };
}
