"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const SLIDE_COUNT = 5;

type Slide = {
  headline: string;
  accent: string;
  /** Text after the highlighted accent phrase */
  afterAccent?: string;
  body: string;
  cta: { label: string; href: string };
  /** Middle “hero card” color (side cards stay muted) */
  centerClass: string;
};

/** Placeholder copy — replace with real banners later */
const SLIDES: Slide[] = [
  {
    headline: "Sprav svoju prvú objednávku",
    accent: "Akcia 10%",
    afterAccent: "pre prvý nákup",
    body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse vel auctor risus.",
    cta: { label: "Objednať teraz", href: "/produkty" },
    centerClass: "bg-accent",
  },
  {
    headline: "Doprava zadarmo",
    accent: "Nad 50 €",
    body: "Ukážkový banner — sem pôjde text o doprave a podmienkach. Upravíme podľa tvojej špecifikácie.",
    cta: { label: "Pozrieť produkty", href: "/produkty" },
    centerClass: "bg-brand",
  },
  {
    headline: "Novinky každý týždeň",
    accent: "Čerstvé modely",
    body: "Placeholder pre výpredaj noviniek alebo limitované série. Neskôr nahradíme reálnym obsahom.",
    cta: { label: "Prejsť na novinky", href: "/produkty" },
    centerClass: "bg-emerald-500",
  },
  {
    headline: "Tlač na mieru",
    accent: "Vlastný dizajn",
    body: "Dočasný text pre banner na službu vlastnej tlače – doladíme text a CTA podľa tvojich podkladov.",
    cta: { label: "Zistiť viac", href: "/tlac-na-mieru" },
    centerClass: "bg-violet-500",
  },
  {
    headline: "Sezónna ponuka",
    accent: "Do −20 %",
    body: "Generický hero na akcie a kupóny. Po dodaní finálnych bannerov sem vložíme správny obsah.",
    cta: { label: "Nakupovať", href: "/produkty" },
    centerClass: "bg-rose-500",
  },
];

const AUTO_MS = 10_000;

/** Share of the sliding strip each slide occupies (percentage of full track width). */
const SLIDE_PERCENT = 100 / SLIDE_COUNT;

export function HomeHeroCarousel() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % SLIDE_COUNT);
    }, AUTO_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section
      className="relative overflow-hidden rounded-2xl bg-neutral-900 p-6 text-white shadow-sm md:p-10"
      aria-roledescription="carousel"
      aria-label="Úvodné bannery"
    >
      <div className="relative min-h-[280px] overflow-hidden md:min-h-[320px]">
        <div
          className="flex ease-out motion-reduce:transition-none motion-reduce:duration-0 transition-transform duration-700"
          style={{
            width: `${SLIDE_COUNT * 100}%`,
            transform: `translateX(-${active * SLIDE_PERCENT}%)`,
          }}
        >
          {SLIDES.map((slide, i) => (
            <div
              key={i}
              className="grid shrink-0 gap-6 md:grid-cols-2 md:items-center"
              style={{ width: `${SLIDE_PERCENT}%` }}
              aria-hidden={i !== active}
              inert={i !== active}
            >
              <div className="max-w-md">
                <h1
                  id={`hero-slide-${i}`}
                  className="text-2xl font-bold leading-tight md:text-3xl"
                >
                  {slide.headline}{" "}
                  <span className="text-accent">{slide.accent}</span>
                  {slide.afterAccent ? <> {slide.afterAccent}</> : null}
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-neutral-300">
                  {slide.body}
                </p>
                <Link
                  href={slide.cta.href}
                  tabIndex={i === active ? 0 : -1}
                  className="mt-5 inline-flex items-center rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
                >
                  {slide.cta.label}
                </Link>
              </div>

              <div className="relative h-48 w-full md:h-64">
                <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-90">
                  <div className="h-32 w-20 rounded-xl bg-neutral-700" />
                  <div className={`h-40 w-24 rounded-xl ${slide.centerClass}`} />
                  <div className="h-32 w-20 rounded-xl bg-neutral-700" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex justify-center gap-1.5">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`Banner ${i + 1} z ${SLIDE_COUNT}`}
            aria-current={i === active ? "true" : undefined}
            className={`h-1.5 w-6 rounded-full transition ${
              i === active
                ? "bg-white"
                : "bg-white/30 hover:bg-white/50"
            }`}
          />
        ))}
      </div>

      <span className="sr-only" aria-live="polite">
        Banner {active + 1} z {SLIDE_COUNT}
      </span>
    </section>
  );
}
