import Logo from "@/components/brand/Logo";
import Navigation from "@/components/marketing/Navigation";

/**
 * Sticky-Header für den öffentlichen Bereich.
 * Logo + Hauptnavigation + CTAs (Navigation kümmert sich um Mobile & aktive Links).
 */
export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-aw-border/80 bg-aw-bg/90 backdrop-blur">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo priority />
        <Navigation />
      </div>
    </header>
  );
}
