import Link from "next/link";

import type { CourseGroupRef, CourseSubgroupRef } from "@/lib/course-groups/course-group-types";

type CourseGroupLinksProps = {
  group: CourseGroupRef | null;
  subgroup: CourseSubgroupRef | null;
  className?: string;
  linkClassName?: string;
};

/**
 * Zeigt Hauptgruppe und optional Untergruppe als klickbare Links.
 */
export default function CourseGroupLinks({
  group,
  subgroup,
  className = "",
  linkClassName = "text-aw-gold hover:underline",
}: CourseGroupLinksProps) {
  if (!group) {
    return null;
  }

  return (
    <p className={`text-sm text-aw-muted ${className}`.trim()}>
      <Link
        href={`/akademie/kurse/gruppen/${encodeURIComponent(group.slug)}`}
        className={linkClassName}
      >
        {group.name}
      </Link>
      {subgroup && (
        <>
          <span className="mx-1.5 text-aw-border">/</span>
          <Link
            href={`/akademie/kurse/gruppen/${encodeURIComponent(group.slug)}/${encodeURIComponent(subgroup.slug)}`}
            className={linkClassName}
          >
            {subgroup.name}
          </Link>
        </>
      )}
    </p>
  );
}
