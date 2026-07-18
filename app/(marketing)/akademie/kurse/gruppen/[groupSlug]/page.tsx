import { redirect } from "next/navigation";

/**
 * Lernpfade / Kursgruppen sind als Produktfeature entfernt.
 * Alte Links landen im Kurskatalog.
 */
export default function CourseGroupPage() {
  redirect("/akademie/kurse");
}
