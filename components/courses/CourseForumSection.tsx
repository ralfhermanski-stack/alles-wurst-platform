import Link from "next/link";

import type { CourseForumGroup } from "@/lib/forums/forum-types";

type CourseForumSectionProps = {
  forums: CourseForumGroup;
};

export default function CourseForumSection({ forums }: CourseForumSectionProps) {
  const hasCourseForums = forums.courseForums.length > 0;
  const hasGlobalForums =
    forums.globalMiniCourseForumsEnabled &&
    forums.globalMiniCourseForums.length > 0;

  if (!hasCourseForums && !hasGlobalForums) {
    return null;
  }

  return (
    <div className="mt-6 space-y-4">
      {hasCourseForums && (
        <section>
          <h2 className="font-display text-lg font-bold text-aw-cream">
            Kursforum
          </h2>
          <ul className="mt-2 divide-y divide-aw-border overflow-hidden rounded-lg border border-aw-border">
            {forums.courseForums.map((forum) => (
              <li key={forum.id}>
                <Link
                  href={`/mein-bereich/foren/${forum.slug}`}
                  className="block px-3 py-2 text-sm text-aw-cream hover:bg-aw-surface/40"
                >
                  {forum.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {hasGlobalForums && (
        <section>
          <h2 className="font-display text-lg font-bold text-aw-cream">
            Minikurs-Community
          </h2>
          <ul className="mt-2 divide-y divide-aw-border overflow-hidden rounded-lg border border-aw-border">
            {forums.globalMiniCourseForums.map((forum) => (
              <li key={forum.id}>
                <Link
                  href={`/mein-bereich/foren/${forum.slug}`}
                  className="block px-3 py-2 text-sm text-aw-cream hover:bg-aw-surface/40"
                >
                  {forum.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
