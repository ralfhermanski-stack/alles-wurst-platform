import Link from "next/link";

import Logo from "@/components/brand/Logo";

/**
 * Layout für Anmeldung und Registrierung — zentriert, ohne Marketing-Header.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-aw-bg">
      <header className="border-b border-aw-border px-4 py-5 sm:px-6">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <Logo />
          <Link
            href="/"
            className="text-sm font-medium text-aw-muted hover:text-aw-cream"
          >
            Zur Startseite
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-lg">{children}</div>
      </main>
    </div>
  );
}
