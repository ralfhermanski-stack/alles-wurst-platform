import type { Metadata } from "next";

import AdminUserDetailPanel from "@/components/admin/users/AdminUserDetailPanel";

export const metadata: Metadata = {
  title: "Admin – Benutzerdetail",
};

type PageProps = {
  params: Promise<{ userId: string }>;
};

export default async function AdminUserDetailPage({ params }: PageProps) {
  const { userId } = await params;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <AdminUserDetailPanel userId={userId} />
    </div>
  );
}
