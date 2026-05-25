"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import {
  CONSENT_CHANGE_EVENT,
  acceptAll,
  readConsent,
  rejectAll,
  writeConsent,
} from "@/lib/cookie-consent";

type View = "hidden" | "banner" | "settings";

export function CookieConsent() {
  const [view, setView] = useState<View>("hidden");
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const analyticsId = useId();
  const marketingId = useId();

  useEffect(() => {
    const sync = () => {
      const c = readConsent();
      if (c) {
        setAnalytics(c.analytics);
        setMarketing(c.marketing);
        setView("hidden");
      } else {
        setView("banner");
      }
    };
    sync();
    window.addEventListener(CONSENT_CHANGE_EVENT, sync);
    return () => window.removeEventListener(CONSENT_CHANGE_EVENT, sync);
  }, []);

  if (view === "hidden") return null;

  const handleAcceptAll = () => {
    acceptAll();
    setView("hidden");
  };
  const handleRejectAll = () => {
    rejectAll();
    setView("hidden");
  };
  const handleSavePreferences = () => {
    writeConsent({ analytics, marketing });
    setView("hidden");
  };

  return (
    <>
      {/* Banner — kompaktný režim */}
      {view === "banner" && (
        <div
          role="dialog"
          aria-modal="false"
          aria-labelledby="cookie-consent-title"
          className="fixed inset-x-3 bottom-3 z-50 md:inset-x-auto md:bottom-5 md:right-5 md:max-w-md"
        >
          <div className="rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-neutral-200 md:p-6">
            <p
              id="cookie-consent-title"
              className="text-base font-semibold text-neutral-900"
            >
              Tento web používa cookies
            </p>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              Nevyhnutné cookies používame na chod e-shopu. So súhlasom použijeme
              aj analytické a marketingové cookies, aby sme web zlepšovali a
              ukazovali relevantnejší obsah. Viac v{" "}
              <Link
                href="/cookies"
                className="font-medium text-brand underline-offset-2 hover:underline"
              >
                zásadách cookies
              </Link>
              {" "}a{" "}
              <Link
                href="/gdpr/cookies"
                className="font-medium text-brand underline-offset-2 hover:underline"
              >
                GDPR
              </Link>
              .
            </p>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={handleAcceptAll}
                className="order-1 inline-flex flex-1 items-center justify-center rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark sm:order-2 sm:flex-none"
              >
                Prijať všetko
              </button>
              <button
                type="button"
                onClick={handleRejectAll}
                className="order-2 inline-flex flex-1 items-center justify-center rounded-full border border-neutral-300 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50 sm:order-1 sm:flex-none"
              >
                Odmietnuť
              </button>
              <button
                type="button"
                onClick={() => setView("settings")}
                className="order-3 inline-flex items-center justify-center rounded-full px-3 py-2.5 text-sm font-medium text-neutral-600 transition hover:text-neutral-900 sm:order-3"
              >
                Nastavenia
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nastavenia — modálne okno */}
      {view === "settings" && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-neutral-900/50 p-3 backdrop-blur-sm md:items-center md:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-settings-title"
        >
          <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="h-1.5 bg-gradient-to-r from-brand via-brand to-accent" />
            <div className="px-6 py-6 md:px-8 md:py-7">
              <p className="text-xs font-bold uppercase tracking-widest text-brand">
                Nastavenia cookies
              </p>
              <h2
                id="cookie-settings-title"
                className="mt-1 text-xl font-bold tracking-tight text-neutral-900 md:text-2xl"
              >
                Vyber si, čo môžeme používať
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                Súhlas môžeš kedykoľvek zmeniť na stránke{" "}
                <Link
                  href="/cookies"
                  className="font-medium text-brand underline-offset-2 hover:underline"
                >
                  Zásady cookies
                </Link>
                .
              </p>

              <div className="mt-5 space-y-3">
                <ToggleRow
                  title="Nevyhnutné"
                  description="Zabezpečujú základnú funkčnosť webu — košík, prihlásenie, zapamätanie tohto súhlasu. Bez nich e-shop nefunguje."
                  checked
                  disabled
                />
                <ToggleRow
                  id={analyticsId}
                  title="Analytické"
                  description="Anonymné štatistiky návštevnosti, aby sme videli, čo na webe funguje, a postupne ho zlepšovali."
                  checked={analytics}
                  onChange={setAnalytics}
                />
                <ToggleRow
                  id={marketingId}
                  title="Marketingové"
                  description="Umožňujú nám zobrazovať relevantnejšie reklamy a merať ich účinnosť. Bez súhlasu sa nepoužívajú."
                  checked={marketing}
                  onChange={setMarketing}
                />
              </div>

              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                <button
                  type="button"
                  onClick={handleRejectAll}
                  className="inline-flex items-center justify-center rounded-full border border-neutral-300 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50"
                >
                  Odmietnuť všetko
                </button>
                <button
                  type="button"
                  onClick={handleSavePreferences}
                  className="inline-flex items-center justify-center rounded-full border border-brand bg-white px-5 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand/5"
                >
                  Uložiť výber
                </button>
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="inline-flex items-center justify-center rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
                >
                  Prijať všetko
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ToggleRow({
  id,
  title,
  description,
  checked,
  disabled,
  onChange,
}: {
  id?: string;
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (next: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-neutral-200 bg-neutral-50/60 p-4">
      <div className="flex-1">
        <label
          htmlFor={id}
          className={`block text-sm font-semibold ${disabled ? "text-neutral-700" : "text-neutral-900"}`}
        >
          {title}
          {disabled && (
            <span className="ml-2 rounded-full bg-neutral-200 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-neutral-600">
              Vždy aktívne
            </span>
          )}
        </label>
        <p className="mt-1 text-xs leading-relaxed text-neutral-600">
          {description}
        </p>
      </div>
      <label
        htmlFor={id}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full transition ${
          checked ? "bg-brand" : "bg-neutral-300"
        } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
      >
        <input
          id={id}
          type="checkbox"
          className="sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.checked)}
        />
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </label>
    </div>
  );
}
