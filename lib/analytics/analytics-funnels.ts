/**
 * @file analytics-funnels.ts
 * @purpose Funnel-Definitionen und Schritt-Zuordnung.
 */

export type AnalyticsFunnelDefinition = {
  id: string;
  label: string;
  steps: { key: string; label: string; eventTypes: string[] }[];
};

export const ANALYTICS_FUNNELS: AnalyticsFunnelDefinition[] = [
  {
    id: "purchase",
    label: "Startseite → Kurs → Checkout → Kauf",
    steps: [
      { key: "home", label: "Startseite", eventTypes: ["pageview"] },
      { key: "course_page", label: "Kursseite", eventTypes: ["pageview"] },
      { key: "checkout_start", label: "Checkout gestartet", eventTypes: ["checkout_start"] },
      { key: "purchase", label: "Zahlung erfolgreich", eventTypes: ["course_purchased"] },
    ],
  },
  {
    id: "registration",
    label: "Registrierung → E-Mail → Login → Kursstart",
    steps: [
      { key: "registration_started", label: "Registrierung gestartet", eventTypes: ["registration_started"] },
      { key: "registration_completed", label: "Registrierung abgeschlossen", eventTypes: ["registration_completed"] },
      { key: "login", label: "Login", eventTypes: ["login"] },
      { key: "course_started", label: "Kurs gestartet", eventTypes: ["course_started"] },
    ],
  },
  {
    id: "course_completion",
    label: "Kursstart → Lektion → Quiz → Abschluss",
    steps: [
      { key: "course_started", label: "Kurs gestartet", eventTypes: ["course_started"] },
      { key: "lesson_started", label: "Lektion 1", eventTypes: ["lesson_started"] },
      { key: "quiz_completed", label: "Quiz abgeschlossen", eventTypes: ["quiz_completed"] },
      { key: "course_completed", label: "Kurs abgeschlossen", eventTypes: ["lesson_completed"] },
    ],
  },
  {
    id: "workshop_affiliate",
    label: "Werkstatt → Affiliate-Klick",
    steps: [
      { key: "workshop_page", label: "Werkstattseite", eventTypes: ["pageview"] },
      { key: "affiliate_click", label: "Affiliate-Klick", eventTypes: ["affiliate_click", "workshop_click"] },
    ],
  },
];

export function getFunnelStepLabel(funnelId: string, stepKey: string): string {
  const funnel = ANALYTICS_FUNNELS.find((entry) => entry.id === funnelId);

  if (!funnel) {
    return stepKey;
  }

  return funnel.steps.find((step) => step.key === stepKey)?.label ?? stepKey;
}
