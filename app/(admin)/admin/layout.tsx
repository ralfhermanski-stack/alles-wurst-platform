import { headers } from "next/headers";

import AdminLayoutShell from "@/components/admin/AdminLayoutShell";
import { requirePagePermission } from "@/lib/permissions/page-guard";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") ?? "/admin";

  await requirePagePermission(pathname);

  return <AdminLayoutShell>{children}</AdminLayoutShell>;
}
