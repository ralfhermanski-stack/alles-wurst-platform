"use client";

export default function ConsentSettingsButton() {
  return (
    <button
      type="button"
      onClick={() => {
        window.dispatchEvent(new CustomEvent("aw:open-consent-settings"));
      }}
      className="text-sm text-aw-cream/80 transition-colors hover:text-aw-gold"
    >
      Cookie-Einstellungen
    </button>
  );
}
