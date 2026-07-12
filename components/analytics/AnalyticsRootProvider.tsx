import { cookies } from "next/headers";

import AnalyticsProvider from "@/components/analytics/AnalyticsProvider";
import { parseConsentCookieValue } from "@/lib/analytics/analytics-consent";
import { CONSENT_COOKIE_NAME } from "@/lib/analytics/analytics-config";

export default async function AnalyticsRootProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const consentValue = cookieStore.get(CONSENT_COOKIE_NAME)?.value ?? null;
  const initialConsent = parseConsentCookieValue(consentValue);

  return (
    <>
      {children}
      <AnalyticsProvider initialConsent={initialConsent} />
    </>
  );
}
