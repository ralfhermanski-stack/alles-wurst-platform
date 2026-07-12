import type { Metadata } from "next";

import AdminUserGroupDetailPanel from "@/components/admin/permissions/AdminUserGroupDetailPanel";

export const metadata: Metadata = {
  title: "Admin – Benutzergruppe",
};

type PageProps = {
  params: Promise<{ groupId: string }>;
};

export default async function AdminUserGroupDetailPage({ params }: PageProps) {
  const { groupId } = await params;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <AdminUserGroupDetailPanel groupId={groupId} />
    </div>
  );
}
