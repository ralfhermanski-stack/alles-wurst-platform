"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import {
  flushAnalyticsBeforeUnload,
  initClickTracking,
  initScrollTracking,
  setAnalyticsConsent,
  trackPageview,
} from "@/lib/analytics/analytics-client";
import type { AnalyticsConsentState } from "@/lib/analytics/analytics-types";

import ConsentBanner from "@/components/consent/ConsentBanner";

type AnalyticsProviderProps = {
  initialConsent: AnalyticsConsentState | null;
};

export default function AnalyticsProvider({
  initialConsent,
}: AnalyticsProviderProps) {
  const pathname = usePathname();
  const [consent, setConsent] = useState<AnalyticsConsentState | null>(
    initialConsent,
  );

  useEffect(() => {
    setAnalyticsConsent(consent);

    if (consent?.statistics) {
      initScrollTracking();
      initClickTracking();
    }
  }, [consent]);

  useEffect(() => {
    if (!consent?.statistics || !pathname) {
      return;
    }

    trackPageview(pathname);
  }, [consent?.statistics, pathname]);

  useEffect(() => {
    const onUnload = () => flushAnalyticsBeforeUnload();

    window.addEventListener("pagehide", onUnload);

    return () => {
      window.removeEventListener("pagehide", onUnload);
    };
  }, []);

  return (
    <ConsentBanner initialConsent={initialConsent} onConsentChange={setConsent} />
  );
}
