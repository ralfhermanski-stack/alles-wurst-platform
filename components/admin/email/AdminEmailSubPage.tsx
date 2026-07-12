"use client";

import { useEffect, useState } from "react";

import AdminEmailNav from "@/components/admin/email/AdminEmailNav";

type Props = {
  title: string;
  description: string;
  resource: "senders" | "providers" | "templates" | "logs";
  query?: { status?: string };
};

export default function AdminEmailSubPage({
  title,
  description,
  resource,
  query,
}: Props) {
  const [rows, setRows] = useState<unknown[]>([]);

  useEffect(() => {
    const params = new URLSearchParams({ resource });
    if (query?.status) {
      params.set("status", query.status);
    }

    void fetch(`/api/admin/email?${params.toString()}`, { credentials: "include" })
      .then((response) => response.json())
      .then((json: { success: boolean; data?: unknown[] }) => {
        if (json.success && json.data) {
          setRows(json.data);
        }
      });
  }, [resource, query?.status]);

  return (
    <AdminEmailNav>
      <div>
        <h2 className="font-display text-xl font-bold text-aw-cream">{title}</h2>
        <p className="mt-2 text-sm text-aw-muted">{description}</p>
      </div>
      <pre className="mt-6 overflow-auto rounded-xl border border-aw-border bg-aw-surface p-4 text-xs text-aw-muted">
        {JSON.stringify(rows, null, 2)}
      </pre>
    </AdminEmailNav>
  );
}
