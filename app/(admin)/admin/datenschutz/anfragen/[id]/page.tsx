"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import AdminPrivacyNav from "@/components/admin/privacy/AdminPrivacyNav";
import {
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

type PrivacyDetail = {
  id: string;
  requestNumber: string;
  type: string;
  status: string;
  userMessage: string | null;
  responseText: string | null;
  rejectionReason: string | null;
  emailConfirmedAt: string | null;
  finalConfirmedAt: string | null;
  user: { email: string };
  supportTicket: { ticketNumber: string; id: string } | null;
  deletionPlan: {
    status: string;
    blockingItems: unknown;
    deletableData: unknown;
    anonymizableData: unknown;
    retainedData: unknown;
  } | null;
};

export default function AdminDatenschutzAnfrageDetailPage() {
  const params = useParams<{ id: string }>();
  const [detail, setDetail] = useState<PrivacyDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch(`/api/admin/privacy/requests/${params.id}`, { credentials: "include" })
      .then((response) => response.json())
      .then((json: { success: boolean; data?: PrivacyDetail }) => {
        if (json.success && json.data) {
          setDetail(json.data);
        }
        setLoading(false);
      });
  }, [params.id]);

  async function setStatus(status: string) {
    await fetch(`/api/admin/privacy/requests/${params.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    setDetail((current) => (current ? { ...current, status } : current));
  }

  if (loading) {
    return (
      <AdminPrivacyNav>
        <p className="text-sm text-aw-muted">Lade …</p>
      </AdminPrivacyNav>
    );
  }

  if (!detail) {
    return (
      <AdminPrivacyNav>
        <p className="text-sm text-aw-warning">Anfrage nicht gefunden.</p>
      </AdminPrivacyNav>
    );
  }

  return (
    <AdminPrivacyNav>
      <div className="space-y-6">
        <div>
          <h2 className="font-display text-xl font-bold text-aw-cream">
            {detail.requestNumber}
          </h2>
          <p className="mt-1 text-sm text-aw-muted">
            {detail.type} · {detail.status} · {detail.user.email}
          </p>
        </div>

        {detail.deletionPlan && (
          <div className="rounded-xl border border-aw-border bg-aw-surface p-4 text-sm text-aw-muted">
            <p className="font-medium text-aw-cream">Löschplan: {detail.deletionPlan.status}</p>
            <pre className="mt-2 overflow-x-auto text-xs">
              {JSON.stringify(detail.deletionPlan, null, 2)}
            </pre>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void setStatus("UNDER_REVIEW")}
            className={secondaryButtonClassName}
          >
            In Bearbeitung
          </button>
          <button
            type="button"
            onClick={() => void setStatus("FULFILLED")}
            className={primaryButtonClassName}
          >
            Erfüllt
          </button>
          <button
            type="button"
            onClick={() => void setStatus("REJECTED")}
            className={secondaryButtonClassName}
          >
            Ablehnen
          </button>
        </div>
      </div>
    </AdminPrivacyNav>
  );
}
