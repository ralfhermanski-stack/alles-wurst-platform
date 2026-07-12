import type { Metadata } from "next";

import AdminGroupComparePanel from "@/components/admin/permissions/AdminGroupComparePanel";

export const metadata: Metadata = {
  title: "Admin – Gruppenvergleich",
};

export default function AdminGroupComparePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <AdminGroupComparePanel />
    </div>
  );
}
