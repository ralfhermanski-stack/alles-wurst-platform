import type { Metadata } from "next";
import { Montserrat, Playfair_Display } from "next/font/google";
import "./globals.css";

import AnalyticsRootProvider from "@/components/analytics/AnalyticsRootProvider";
import DevTools from "@/components/dev/DevTools";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Alles-Wurst – The Crest of Craftsmanship",
    template: "%s – Alles-Wurst",
  },
  description:
    "Die digitale Heimat für handwerkliche Wurstherstellung, Räuchern und Fleischverarbeitung. Kurse, Community, Werkzeuge und der exklusive Meisterclub.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      className={`${montserrat.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-aw-bg text-aw-cream">
        <AnalyticsRootProvider>{children}</AnalyticsRootProvider>
        <DevTools />
      </body>
    </html>
  );
}
