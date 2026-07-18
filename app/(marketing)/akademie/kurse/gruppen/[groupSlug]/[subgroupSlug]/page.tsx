import { redirect } from "next/navigation";

/**
 * Lernpfad-Module sind als Produktfeature entfernt.
 * Alte Links landen im Kurskatalog.
 */
export default function CourseSubgroupPage() {
  redirect("/akademie/kurse");
}
