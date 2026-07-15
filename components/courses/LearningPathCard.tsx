import Link from "next/link";

import type { PublicCourseGroupCard } from "@/lib/course-groups/course-group-types";

type LearningPathCardProps = {
  path: PublicCourseGroupCard;
};

export default function LearningPathCard({ path }: LearningPathCardProps) {
  const href = `/akademie/kurse/gruppen/${path.slug}`;

  return (
    <article className="flex flex-col rounded-xl border border-aw-border bg-aw-surface p-6">
      {path.levelLabel && (
        <span className="text-xs font-medium uppercase tracking-wider text-aw-gold">
          {path.levelLabel}
        </span>
      )}
      <h3
        className={`font-display text-xl font-bold text-aw-cream ${path.levelLabel ? "mt-2" : ""}`}
      >
        {path.name}
      </h3>
      {path.shortDescription && (
        <p className="mt-2 flex-1 text-sm leading-6 text-aw-muted">
          {path.shortDescription}
        </p>
      )}
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-aw-muted">
          {path.courseCount} Kurs{path.courseCount === 1 ? "" : "e"}
          {path.subgroupCount > 0
            ? ` · ${path.subgroupCount} Modul${path.subgroupCount === 1 ? "" : "e"}`
            : ""}
        </span>
        <Link
          href={href}
          className="font-semibold text-aw-gold hover:text-aw-cream"
        >
          Pfad ansehen →
        </Link>
      </div>
    </article>
  );
}
