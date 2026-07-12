"use client";

import { useEffect, useState } from "react";

import {
  getMaintenanceAdminApi,
  updateMaintenanceAdminApi,
} from "@/lib/maintenance/maintenance-client";

export default function AdminMaintenanceBanner() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      const response = await getMaintenanceAdminApi();

      if (response.success) {
        setEnabled(response.data.settings.enabled);
      }

      setLoading(false);
    })();
  }, []);

  if (loading || !enabled) {
    return null;
  }

  async function handleDisable() {
    setSaving(true);
    const response = await updateMaintenanceAdminApi({ enabled: false });
    setSaving(false);

    if (response.success) {
      setEnabled(false);
    }
  }

  return (
    <div
      className="mb-8 rounded-xl border border-red-500/50 bg-red-500/10 px-5 py-4"
      role="alert"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-red-200">
          Wartungsmodus aktiv – Besucher sehen aktuell die Wartungsseite.
        </p>
        <button
          type="button"
          disabled={saving}
          onClick={() => void handleDisable()}
          className="rounded-lg border border-red-400/50 bg-red-500/20 px-4 py-2 text-sm font-medium text-red-100 hover:bg-red-500/30 disabled:opacity-60"
        >
          {saving ? "Deaktiviert …" : "Wartungsmodus deaktivieren"}
        </button>
      </div>
    </div>
  );
}
