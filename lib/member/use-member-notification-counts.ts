"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type UnreadCountResponse = {
  success: boolean;
  data?: { unreadCount: number };
};

/**
 * Lädt ungelesene Nachrichten und Support-Antworten für Badges in der Navigation.
 */
export function useMemberNotificationCounts() {
  const pathname = usePathname();
  const [messageUnreadCount, setMessageUnreadCount] = useState(0);
  const [supportUnreadCount, setSupportUnreadCount] = useState(0);

  useEffect(() => {
    void Promise.all([
      fetch("/api/account/messages/unread-count", { credentials: "include" }).then(
        (response) => response.json() as Promise<UnreadCountResponse>,
      ),
      fetch("/api/support/unread-count", { credentials: "include" }).then(
        (response) => response.json() as Promise<UnreadCountResponse>,
      ),
    ])
      .then(([messagesJson, supportJson]) => {
        if (messagesJson.success && messagesJson.data) {
          setMessageUnreadCount(messagesJson.data.unreadCount);
        }

        if (supportJson.success && supportJson.data) {
          setSupportUnreadCount(supportJson.data.unreadCount);
        }
      })
      .catch(() => {
        // Badges sind optional — Fehler still ignorieren.
      });
  }, [pathname]);

  return { messageUnreadCount, supportUnreadCount };
}
