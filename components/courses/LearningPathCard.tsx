import Link from "next/link";

import type { PublicCourseGroupCard } from "@/lib/course-groups/course-group-types";

type LearningPathCardProps = {
  path: PublicCourseGroupCard;
};

export default function LearningPathCard({ path }: LearningPathCardProps) {
  const href = `/akademie/kurse/gruppen/${path.slug}`;

  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-xl border border-aw-border bg-aw-surface transition-all hover:-translate-y-1 hover:border-aw-gold/50 hover:shadow-[0_18px_40px_-24px_rgba(212,175,55,0.5)]"
    >
      <div className="relative h-44 overflow-hidden sm:h-48">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/course-groups/${path.id}/image`}
          alt={path.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-aw-bg/90 via-aw-bg/20 to-transparent"
        />
        {path.levelLabel && (
          <span className="absolute left-4 top-4 rounded-full bg-aw-bg/75 px-3 py-1 text-xs font-medium uppercase tracking-wider text-aw-gold ring-1 ring-aw-gold/30 backdrop-blur-sm">
            {path.levelLabel}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-xl font-bold text-aw-cream">{path.name}</h3>
        {path.shortDescription && (
          <p className="mt-2 flex-1 text-sm leading-6 text-aw-muted">
            {path.shortDescription}
          </p>
        )}
        <div className="mt-4 flex items-center justify-between gap-3 text-sm">
          <span className="text-aw-muted">
            {path.courseCount} Kurs{path.courseCount === 1 ? "" : "e"}
            {path.subgroupCount > 0
              ? ` · ${path.subgroupCount} Modul${path.subgroupCount === 1 ? "" : "e"}`
              : ""}
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-aw-gold">
            Pfad ansehen
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 transition-transform group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                d="M5 12h14M13 6l6 6-6 6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
