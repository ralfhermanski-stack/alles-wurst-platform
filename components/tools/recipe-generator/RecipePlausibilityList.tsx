"use client";

/**
 * @file RecipePlausibilityList.tsx
 * @purpose Anzeige der Plausibilitätsprüfungen im Rezeptgenerator.
 * @usage Live-Summary (kompakt) und Zusammenfassung (vollständig).
 */

import type {
  PlausibilityIssue,
  PlausibilitySeverity,
} from "@/lib/tools/recipe-plausibility";
import { PLAUSIBILITY_STEP_LABELS } from "@/lib/tools/recipe-plausibility";

type RecipePlausibilityListProps = {
  issues: PlausibilityIssue[];
  /** Nur warning/critical — für die Seitenleiste */
  compact?: boolean;
  /** Überschrift anzeigen */
  showTitle?: boolean;
};

const SEVERITY_STYLES: Record<
  PlausibilitySeverity,
  { box: string; badge: string; label: string }
> = {
  info: {
    box: "border-aw-border bg-aw-surface-2/80",
    badge: "bg-aw-muted/20 text-aw-muted",
    label: "Hinweis",
  },
  warning: {
    box: "border-aw-warning/40 bg-aw-warning/10",
    badge: "bg-aw-warning/20 text-aw-warning",
    label: "Prüfen",
  },
  critical: {
    box: "border-red-500/50 bg-red-950/40",
    badge: "bg-red-500/20 text-red-300",
    label: "Wichtig",
  },
};

/**
 * Liste der Plausibilitätsmeldungen mit Schweregrad-Farben.
 */
export default function RecipePlausibilityList({
  issues,
  compact = false,
  showTitle = true,
}: RecipePlausibilityListProps) {
  const visible = compact
    ? issues.filter((item) => item.severity !== "info")
    : issues;

  if (visible.length === 0) {
    if (compact) {
      return (
        <p className="mt-4 text-xs text-aw-success">
          Keine auffälligen Hinweise.
        </p>
      );
    }

    return (
      <p className="rounded-lg border border-aw-success/30 bg-aw-success/10 px-4 py-3 text-sm text-aw-success">
        Alles sieht plausibel aus — du kannst das Rezept speichern.
      </p>
    );
  }

  return (
    <div className={compact ? "mt-4 border-t border-aw-border pt-4" : ""}>
      {showTitle && (
        <h4
          className={`font-semibold text-aw-cream ${compact ? "text-xs uppercase tracking-wide text-aw-muted" : "text-base"}`}
        >
          {compact ? "Hinweise" : "Prüfliste"}
        </h4>
      )}
      <ul className={`space-y-2 ${showTitle ? "mt-3" : ""}`}>
        {visible.map((item, index) => {
          const styles = SEVERITY_STYLES[item.severity];

          return (
            <li
              key={`${item.code}-${index}`}
              className={`rounded-lg border px-3 py-2.5 text-xs leading-5 ${styles.box}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${styles.badge}`}
                >
                  {styles.label}
                </span>
                {item.blocking && (
                  <span className="rounded-full bg-aw-cream/10 px-2 py-0.5 text-[10px] font-semibold text-aw-cream">
                    Speichern blockiert
                  </span>
                )}
                <span className="text-[10px] text-aw-muted">
                  {PLAUSIBILITY_STEP_LABELS[item.affectedStep]}
                </span>
              </div>
              <p className="mt-1.5 font-semibold text-aw-cream">{item.title}</p>
              <p className="mt-0.5 text-aw-muted">{item.message}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
