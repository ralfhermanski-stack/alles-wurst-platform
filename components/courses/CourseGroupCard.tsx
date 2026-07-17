import Link from "next/link";

import type { PublicCourseGroupCard } from "@/lib/course-groups/course-group-types";

type CourseGroupCardProps = {
  group: PublicCourseGroupCard;
  href?: string;
};

export default function CourseGroupCard({ group, href }: CourseGroupCardProps) {
  const targetHref = href ?? `/akademie/kurse/gruppen/${group.slug}`;

  return (
    <Link
      href={targetHref}
      className="group flex flex-col overflow-hidden rounded-xl border border-aw-border bg-aw-surface transition-all hover:-translate-y-1 hover:border-aw-gold/50 hover:shadow-[0_18px_40px_-24px_rgba(212,175,55,0.5)]"
    >
      <div className="relative h-40 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/course-groups/${group.id}/image`}
          alt={group.name}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-base font-bold text-aw-cream">
          {group.name}
        </h3>
        {group.shortDescription && (
          <p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-aw-muted">
            {group.shortDescription}
          </p>
        )}
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-aw-gold">
          Kurse ansehen
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 transition-transform group-hover:translate-x-1"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
    </Link>
  );
}
