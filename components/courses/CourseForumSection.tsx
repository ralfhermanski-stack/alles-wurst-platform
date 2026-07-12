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
    <div className="mt-8 space-y-6">
      {hasCourseForums && (
        <section className="rounded-xl border border-aw-border bg-aw-surface/40 p-5">
          <h2 className="font-display text-xl font-bold text-aw-cream">
            Kursforum
          </h2>
          <ul className="mt-4 space-y-2">
            {forums.courseForums.map((forum) => (
              <li key={forum.id}>
                <Link
                  href={`/mein-bereich/foren/${forum.slug}`}
                  className="block rounded-lg border border-aw-border px-4 py-3 text-sm text-aw-cream hover:border-aw-gold/50"
                >
                  {forum.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {hasGlobalForums && (
        <section className="rounded-xl border border-aw-border bg-aw-surface/40 p-5">
          <h2 className="font-display text-xl font-bold text-aw-cream">
            Minikurs-Community
          </h2>
          <ul className="mt-4 space-y-2">
            {forums.globalMiniCourseForums.map((forum) => (
              <li key={forum.id}>
                <Link
                  href={`/mein-bereich/foren/${forum.slug}`}
                  className="block rounded-lg border border-aw-border px-4 py-3 text-sm text-aw-cream hover:border-aw-gold/50"
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
