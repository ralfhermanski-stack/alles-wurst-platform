import type { Metadata } from "next";

import AdminMembershipList from "@/components/admin/memberships/AdminMembershipList";
import AdminMembershipRenewalsPanel from "@/components/admin/memberships/AdminMembershipRenewalsPanel";

export const metadata: Metadata = {
  title: "Admin – Mitgliedschaften",
};

export default function AdminMembershipsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
      <AdminMembershipList />
      <AdminMembershipRenewalsPanel />
    </div>
  );
}
