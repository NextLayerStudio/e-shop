"use client";

import { clearConsent } from "@/lib/cookie-consent";

export function CookieReopenButton() {
  return (
    <button
      type="button"
      onClick={() => clearConsent()}
      className="inline-flex items-center justify-center rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
    >
      Spravovať cookies
    </button>
  );
}
