"use client";

import { Analytics } from "@vercel/analytics/next";
import { useEffect, useState } from "react";
import { CONSENT_CHANGE_EVENT, readConsent } from "@/lib/cookie-consent";

/**
 * Mounts Vercel Web Analytics only after the user grants the
 * "analytics" cookie consent. Listens for consent changes so the
 * tracking turns on/off in real time.
 */
export function AnalyticsGate() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const sync = () => setEnabled(readConsent()?.analytics === true);
    sync();
    window.addEventListener(CONSENT_CHANGE_EVENT, sync);
    return () => window.removeEventListener(CONSENT_CHANGE_EVENT, sync);
  }, []);

  if (!enabled) return null;
  return <Analytics />;
}
