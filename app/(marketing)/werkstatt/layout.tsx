import { headers } from "next/headers";

import { requirePagePermission } from "@/lib/permissions/page-guard";

export default async function WerkstattLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") ?? "/werkstatt";

  await requirePagePermission(pathname);

  return children;
}
