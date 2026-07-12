import type { Metadata } from "next";

import AdminOrderList from "@/components/admin/orders/AdminOrderList";

export const metadata: Metadata = {
  title: "Admin – Bestellungen",
};

export default function AdminOrdersPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <AdminOrderList />
    </div>
  );
}
