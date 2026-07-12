import Link from "next/link";
import Icon from "@/components/brand/Icon";
import type { Course } from "@/lib/placeholder-data";

const levelTone: Record<Course["level"], string> = {
  Einsteiger: "bg-aw-success/15 text-aw-success",
  Fortgeschritten: "bg-aw-gold/15 text-aw-gold",
  Profi: "bg-aw-warning/15 text-aw-warning",
  Meister: "bg-aw-brown/40 text-aw-gold",
};

// Passendes Motiv-Icon je Kurskategorie (dekorativ)
const categoryIcon: Record<string, string> = {
  Grundlagen: "book",
  Wurstherstellung: "sausage",
  Räuchern: "flame",
  Rohwurst: "sausage",
  Pökeln: "brine",
  Wild: "leaf",
};

/**
 * Kurskarte für Katalog- und Übersichtsansichten.
 * Verlinkt (Platzhalter) auf die Kursliste – keine echte Kurslogik.
 */
export default function CourseCard({ course }: { course: Course }) {
  const icon = categoryIcon[course.category] ?? "knife";

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-aw-border bg-aw-surface transition-all hover:-translate-y-1 hover:border-aw-gold/50 hover:shadow-[0_18px_40px_-24px_rgba(212,175,55,0.5)]">
      {/* Bild-Platzhalter mit Farbverlauf + dezentem Motiv-Wappen */}
      <div
        className={`relative flex h-40 items-end overflow-hidden bg-gradient-to-br ${course.accent} to-aw-bg p-4`}
      >
        {/* Großes, dezentes Motiv */}
        <Icon
          name={icon}
          className="pointer-events-none absolute -right-5 top-1/2 h-40 w-40 -translate-y-1/2 text-aw-cream/[0.07] transition-transform duration-500 group-hover:scale-110"
        />
        {/* Kleines Icon-Emblem oben links */}
        <span className="absolute left-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-aw-bg/50 text-aw-gold ring-1 ring-aw-border backdrop-blur-sm">
          <Icon name={icon} className="h-5 w-5" />
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-aw-bg/70 px-2 py-1 text-xs text-aw-muted backdrop-blur-sm">
          {course.category}
        </span>
        <span
          className={`relative rounded-full px-2.5 py-1 text-xs font-medium ${levelTone[course.level]}`}
        >
          {course.level}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-lg font-bold text-aw-cream">
          {course.title}
        </h3>
        <p className="mt-2 flex-1 text-sm leading-6 text-aw-muted">{course.excerpt}</p>

        <div className="mt-4 flex items-center justify-between text-xs text-aw-muted">
          <span>{course.lessons} Lektionen</span>
          <span>{course.duration}</span>
        </div>

        <Link
          href="/akademie/kurse/beispielkurs"
          className="mt-4 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold text-aw-gold ring-1 ring-aw-gold/40 transition-colors group-hover:bg-aw-gold group-hover:text-aw-bg"
        >
          Kurs ansehen
        </Link>
      </div>
    </article>
  );
}
