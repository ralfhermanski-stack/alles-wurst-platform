import type { Metadata } from "next";

import AdminUserList from "@/components/admin/users/AdminUserList";

export const metadata: Metadata = {
  title: "Admin – Benutzer",
};

export default function AdminUsersPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <AdminUserList />
    </div>
  );
}
