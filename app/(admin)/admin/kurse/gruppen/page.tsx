import { redirect } from "next/navigation";

/**
 * Admin-UI für Lernpfade entfernt — Kursverwaltung läuft über /admin/kurse.
 */
export default function AdminCourseGroupsPage() {
  redirect("/admin/kurse");
}
