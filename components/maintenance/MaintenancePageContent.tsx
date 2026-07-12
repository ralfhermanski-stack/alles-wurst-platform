import MaintenanceCountdown from "./MaintenanceCountdown";
import MaintenanceNewsletterForm from "./MaintenanceNewsletterForm";
import type { MaintenanceSettingsData } from "@/lib/maintenance/maintenance-types";

type MaintenancePageContentProps = {
  settings: MaintenanceSettingsData;
  variant?: "page" | "preview";
};

export default function MaintenancePageContent({
  settings,
  variant = "page",
}: MaintenancePageContentProps) {
  const isPreview = variant === "preview";
  const paragraphs = settings.text.split(/\n\s*\n/).filter(Boolean);

  return (
    <div
      className={`relative flex flex-col items-center justify-center px-4 sm:px-6 ${
        isPreview ? "min-h-[520px] py-10" : "min-h-screen py-16"
      }`}
      style={
        settings.backgroundUrl
          ? {
              backgroundImage: `linear-gradient(rgba(20,25,28,0.88), rgba(20,25,28,0.92)), url(${settings.backgroundUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.12),transparent_55%)]"
        aria-hidden
      />

      <div className="relative z-10 mx-auto w-full max-w-2xl text-center">
        {settings.showLogo && (
          <div className="mb-8 flex justify-center">
            {settings.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={settings.logoUrl}
                alt="Alles Wurst Logo"
                className="max-h-16 w-auto"
              />
            ) : (
              <p className="font-display text-3xl font-bold tracking-[0.2em] text-aw-gold sm:text-4xl">
                ALLES WURST
              </p>
            )}
          </div>
        )}

        <h1 className="font-display text-2xl font-bold text-aw-cream sm:text-3xl">
          {settings.title}
        </h1>

        <div className="mt-6 space-y-4 text-base leading-relaxed text-aw-muted sm:text-lg">
          {paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>

        {settings.countdownEnabled && settings.endDate && (
          <MaintenanceCountdown endDate={settings.endDate} />
        )}

        {settings.newsletterEnabled && (
          <MaintenanceNewsletterForm disabled={isPreview} />
        )}
      </div>
    </div>
  );
}
