import type { Metadata } from "next";
import Link from "next/link";
import Icon from "@/components/brand/Icon";
import CourseCard from "@/components/cards/CourseCard";
import { courses } from "@/lib/placeholder-data";

export const metadata: Metadata = {
  title: "Grundlagen der Wurstherstellung – Kurs",
  description:
    "Beispielhafte Kursdetailseite der Alles-Wurst Akademie – Design- und Strukturvorlage (Prototyp mit Platzhalterdaten).",
};

// ── Platzhalterdaten (nur für die Design-Vorlage) ────────────────────────────
const meta = [
  { icon: "cap", label: "Schwierigkeit", value: "Einsteiger" },
  { icon: "clock", label: "Kursdauer", value: "3 Std 20 Min" },
  { icon: "book", label: "Lektionen", value: "18 Lektionen" },
  { icon: "medal", label: "Zertifikat", value: "Möglich" },
];

const learnings = [
  {
    title: "Grundlagen verstehen",
    text: "Fleischqualität, Fettanteil und Bindung – das Fundament jeder guten Wurst.",
  },
  {
    title: "Praktische Herstellung",
    text: "Vom Wolfen über das Kuttern bis zum sauberen Abfüllen in den Darm.",
  },
  {
    title: "Fehler vermeiden",
    text: "Typische Stolperfallen erkennen, bevor sie deine Wurst ruinieren.",
  },
  {
    title: "Eigene Rezepte entwickeln",
    text: "Gewürze und Verhältnisse gezielt anpassen und deine Signatur finden.",
  },
];

const description = [
  "Dieser Kurs begleitet dich Schritt für Schritt vom rohen Fleisch bis zur fertigen Wurst. Du lernst, worauf es beim Handwerk wirklich ankommt – von der Auswahl der Zutaten über die richtige Verarbeitungstemperatur bis hin zur sicheren Reifung und Lagerung.",
  "Jede Lektion baut auf der vorherigen auf und verbindet fundiertes Hintergrundwissen mit konkreten, nachvollziehbaren Praxisschritten. So verstehst du nicht nur das „Wie“, sondern auch das „Warum“ hinter jedem Arbeitsschritt und kannst dein Wissen später eigenständig auf neue Rezepte übertragen.",
  "Am Ende des Kurses hast du deine erste eigene Wurst hergestellt, kennst die wichtigsten Techniken des Handwerks und bist bereit, dich an anspruchsvollere Rezepturen zu wagen. Der Kurs eignet sich ideal als Einstieg in die Welt der handwerklichen Wurstherstellung.",
];

type Lesson = { title: string; duration: string; badge?: string };
type Module = { title: string; lessons: Lesson[] };

const modules: Module[] = [
  {
    title: "Modul 1 – Grundlagen",
    lessons: [
      { title: "Lektion 1: Fleisch- und Fettkunde", duration: "14 Min" },
      { title: "Lektion 2: Werkzeuge & Hygiene", duration: "11 Min" },
      { title: "Lektion 3: Salz, Gewürze & Bindung", duration: "18 Min" },
    ],
  },
  {
    title: "Modul 2 – Praxis",
    lessons: [
      { title: "Lektion 1: Wolfen & Kuttern", duration: "22 Min" },
      { title: "Lektion 2: Würzen & Abschmecken", duration: "16 Min" },
      { title: "Lektion 3: Abfüllen & Portionieren", duration: "19 Min" },
    ],
  },
  {
    title: "Modul 3 – Abschluss",
    lessons: [
      { title: "Quiz: Wissensüberprüfung", duration: "10 Fragen", badge: "Quiz" },
      { title: "Zertifikat freischalten", duration: "PDF", badge: "Zertifikat" },
    ],
  },
];

const audiences = [
  { icon: "spark", title: "Einsteiger", text: "Du startest bei null und willst es von Grund auf richtig lernen." },
  { icon: "users", title: "Hobbywurstler", text: "Du wurstest gelegentlich und möchtest verlässlichere Ergebnisse." },
  { icon: "cap", title: "Fortgeschrittene", text: "Du willst deine Technik verfeinern und Wissenslücken schließen." },
  { icon: "leaf", title: "Selbstversorger", text: "Du verarbeitest eigenes Fleisch und suchst sicheres Handwerk." },
];

const requirements = [
  "Keine Vorkenntnisse erforderlich",
  "Grundausstattung empfohlen (Fleischwolf, Waage, Thermometer)",
  "Motivation zum Lernen und Ausprobieren",
];

const courseHref = "/akademie/kurse/beispielkurs";

export default function BeispielkursPage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-aw-border bg-aw-surface/40">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_120%_at_0%_-20%,rgba(212,175,55,0.12),transparent_60%)]"
        />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          {/* Text */}
          <div>
            <nav className="flex items-center gap-2 text-xs text-aw-muted" aria-label="Breadcrumb">
              <Link href="/akademie" className="hover:text-aw-cream">
                Akademie
              </Link>
              <span aria-hidden="true">/</span>
              <Link href="/akademie/kurse" className="hover:text-aw-cream">
                Kurse
              </Link>
              <span aria-hidden="true">/</span>
              <span className="text-aw-cream/80">Grundlagen der Wurstherstellung</span>
            </nav>

            <h1 className="mt-4 font-display text-3xl font-bold leading-tight text-aw-cream sm:text-4xl md:text-5xl">
              Grundlagen der Wurstherstellung
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-aw-muted">
              Vom Fleisch bis zur fertigen Wurst – dein strukturierter Einstieg in das
              Handwerk, verständlich erklärt und direkt zum Nachmachen.
            </p>

            {/* Meta-Badges */}
            <dl className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {meta.map((m) => (
                <div
                  key={m.label}
                  className="rounded-xl border border-aw-border bg-aw-surface p-4"
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-aw-surface-2 text-aw-gold ring-1 ring-aw-border">
                    <Icon name={m.icon} className="h-5 w-5" />
                  </span>
                  <dt className="mt-3 text-xs uppercase tracking-wider text-aw-muted">
                    {m.label}
                  </dt>
                  <dd className="mt-0.5 text-sm font-semibold text-aw-cream">{m.value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={courseHref}
                className="inline-flex items-center justify-center rounded-md bg-aw-gold px-6 py-3 text-sm font-semibold text-aw-bg transition-colors hover:bg-aw-gold-dark hover:text-aw-cream"
              >
                Jetzt starten
              </Link>
              <Link
                href="/mitgliedschaft"
                className="inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-semibold text-aw-cream ring-1 ring-aw-border transition-colors hover:bg-aw-surface-2"
              >
                Mitgliedschaft ansehen
              </Link>
            </div>
          </div>

          {/* Kursbild-Platzhalter */}
          <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl border border-aw-border bg-gradient-to-br from-aw-brown/40 to-aw-bg">
            <Icon
              name="sausage"
              className="h-40 w-40 text-aw-cream/10"
            />
            <span className="absolute left-4 top-4 rounded-full bg-aw-success/15 px-2.5 py-1 text-xs font-medium text-aw-success">
              Einsteiger
            </span>
            <span className="absolute bottom-4 right-4 rounded-full bg-aw-bg/70 px-3 py-1 text-xs text-aw-muted backdrop-blur-sm">
              Kursbild-Platzhalter
            </span>
          </div>
        </div>
      </section>

      {/* ── Das lernst du ────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="font-display text-2xl font-bold text-aw-cream">Das lernst du</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {learnings.map((l) => (
            <div
              key={l.title}
              className="flex gap-4 rounded-xl border border-aw-border bg-aw-surface p-5"
            >
              <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-aw-gold/15 text-aw-gold ring-1 ring-aw-gold/30">
                <Icon name="check" className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-semibold text-aw-cream">{l.title}</h3>
                <p className="mt-1 text-sm leading-6 text-aw-muted">{l.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Kursbeschreibung ─────────────────────────────────────────────── */}
      <section className="border-y border-aw-border bg-aw-surface/40">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <h2 className="font-display text-2xl font-bold text-aw-cream">Kursbeschreibung</h2>
          <div className="mt-6 space-y-5 text-base leading-8 text-aw-muted">
            {description.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </div>
      </section>

      {/* ── Kursaufbau ───────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <h2 className="font-display text-2xl font-bold text-aw-cream">Kursaufbau</h2>
        <p className="mt-2 text-sm text-aw-muted">
          3 Module · 8 Lektionen · Quiz &amp; Zertifikat
        </p>

        <div className="mt-8 space-y-5">
          {modules.map((module, mi) => (
            <div
              key={module.title}
              className="overflow-hidden rounded-xl border border-aw-border bg-aw-surface"
            >
              <div className="flex items-center gap-3 border-b border-aw-border bg-aw-surface-2/50 px-5 py-4">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-aw-gold/15 text-sm font-bold text-aw-gold ring-1 ring-aw-gold/30">
                  {mi + 1}
                </span>
                <h3 className="font-display text-lg font-bold text-aw-cream">
                  {module.title}
                </h3>
              </div>
              <ul className="divide-y divide-aw-border">
                {module.lessons.map((lesson) => (
                  <li
                    key={lesson.title}
                    className="flex items-center justify-between gap-4 px-5 py-3.5"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-aw-surface-2 text-aw-gold ring-1 ring-aw-border">
                        <Icon
                          name={lesson.badge === "Zertifikat" ? "medal" : lesson.badge === "Quiz" ? "analysis" : "video"}
                          className="h-4 w-4"
                        />
                      </span>
                      <span className="text-sm text-aw-cream/90">{lesson.title}</span>
                    </div>
                    <span className="shrink-0 text-xs text-aw-muted">{lesson.duration}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── Für wen ist dieser Kurs geeignet ─────────────────────────────── */}
      <section className="border-y border-aw-border bg-aw-surface/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="font-display text-2xl font-bold text-aw-cream">
            Für wen ist dieser Kurs geeignet?
          </h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {audiences.map((a) => (
              <div
                key={a.title}
                className="rounded-xl border border-aw-border bg-aw-surface p-5"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-aw-surface-2 text-aw-gold ring-1 ring-aw-border">
                  <Icon name={a.icon} className="h-6 w-6" />
                </span>
                <h3 className="mt-4 font-semibold text-aw-cream">{a.title}</h3>
                <p className="mt-1 text-sm leading-6 text-aw-muted">{a.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Voraussetzungen & Zertifikat ─────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
          {/* Voraussetzungen */}
          <div>
            <h2 className="font-display text-2xl font-bold text-aw-cream">Voraussetzungen</h2>
            <ul className="mt-6 space-y-4">
              {requirements.map((req) => (
                <li key={req} className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-aw-gold/15 text-aw-gold ring-1 ring-aw-gold/30">
                    <Icon name="check" className="h-4 w-4" />
                  </span>
                  <span className="text-sm leading-6 text-aw-cream/90">{req}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Zertifikat-Vorschau */}
          <div className="rounded-2xl border border-aw-gold/30 bg-gradient-to-b from-aw-gold/10 to-aw-surface p-6">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-aw-gold/15 text-aw-gold ring-1 ring-aw-gold/40">
                <Icon name="medal" className="h-7 w-7" />
              </span>
              <div>
                <h2 className="font-display text-lg font-bold text-aw-cream">Zertifikat</h2>
                <p className="text-xs text-aw-gold">Digitaler Nachweis</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-aw-muted">
              Nach erfolgreichem Abschluss erhältst du ein digitales
              Alles-Wurst&nbsp;Zertifikat.
            </p>
            <div className="mt-5 flex items-center justify-center rounded-lg border border-dashed border-aw-border bg-aw-bg/40 px-4 py-6 text-center">
              <div>
                <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-aw-gold">
                  Alles Wurst
                </p>
                <p className="mt-1 text-xs text-aw-muted">Zertifikat-Vorschau</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Weitere Kurse ────────────────────────────────────────────────── */}
      <section className="border-t border-aw-border bg-aw-surface/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-2xl font-bold text-aw-cream">Weitere Kurse</h2>
            <Link
              href="/akademie/kurse"
              className="hidden text-sm font-semibold text-aw-gold hover:text-aw-cream sm:inline"
            >
              Alle Kurse →
            </Link>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.slice(1, 4).map((course) => (
              <CourseCard key={course.slug} course={course} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
