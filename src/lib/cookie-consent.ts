/**
 * Cookie consent — uloženie a načítanie voľby zo zariadenia návštevníka.
 *
 * Voľbu ukladáme do `localStorage` (jednoduchšie než HttpOnly cookies pre
 * čisto klientské UI; pri zmene v budúcnosti stačí navýšiť `CONSENT_VERSION`,
 * čím sa staré rozhodnutie zneplatní a banner sa zákazníkovi zobrazí znova).
 */

export const CONSENT_STORAGE_KEY = "iknow3d.cookie-consent";
export const CONSENT_VERSION = 1;
export const CONSENT_CHANGE_EVENT = "iknow3d:cookie-consent-change";

export type CookieCategory = "necessary" | "analytics" | "marketing";

export interface CookieConsent {
  version: number;
  timestamp: number;
  necessary: true;
  analytics: boolean;
  marketing: boolean;
}

/** Načíta uloženú voľbu (alebo `null` ak ešte nebola udelená). */
export function readConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CookieConsent>;
    if (parsed.version !== CONSENT_VERSION) return null;
    return {
      version: CONSENT_VERSION,
      timestamp: parsed.timestamp ?? Date.now(),
      necessary: true,
      analytics: parsed.analytics === true,
      marketing: parsed.marketing === true,
    };
  } catch {
    return null;
  }
}

/** Uloží voľbu a oznámi ostatným komponentom, že sa zmenila. */
export function writeConsent(input: {
  analytics: boolean;
  marketing: boolean;
}): CookieConsent {
  const value: CookieConsent = {
    version: CONSENT_VERSION,
    timestamp: Date.now(),
    necessary: true,
    analytics: input.analytics,
    marketing: input.marketing,
  };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(value));
    window.dispatchEvent(
      new CustomEvent<CookieConsent>(CONSENT_CHANGE_EVENT, { detail: value })
    );
  }
  return value;
}

/** Zmaže voľbu — banner sa zákazníkovi zobrazí znova. */
export function clearConsent(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CONSENT_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGE_EVENT, { detail: null }));
}

/** Skratky pre časté akcie z bannera. */
export const acceptAll = () => writeConsent({ analytics: true, marketing: true });
export const rejectAll = () => writeConsent({ analytics: false, marketing: false });
