"use client";

import { Suspense } from "react";

import AdminGate from "@/components/admin/AdminGate";
import AdminSidebar from "@/components/admin/AdminSidebar";

type AdminLayoutShellProps = {
  children: React.ReactNode;
};

function AdminSidebarFallback() {
  return (
    <aside className="hidden border-b border-aw-border bg-aw-surface lg:block lg:h-screen lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r" />
  );
}

/**
 * Client-Layout für den Adminbereich.
 * Sidebar und Inhalt liegen in getrennten Z-Ebenen, damit Navigation nicht
 * vom Hauptbereich überdeckt wird.
 */
export default function AdminLayoutShell({ children }: AdminLayoutShellProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      <div className="relative z-30 shrink-0">
        <Suspense fallback={<AdminSidebarFallback />}>
          <AdminSidebar />
        </Suspense>
      </div>
      <main className="relative z-10 min-w-0 flex-1 bg-aw-bg">
        <AdminGate>{children}</AdminGate>
      </main>
    </div>
  );
}
