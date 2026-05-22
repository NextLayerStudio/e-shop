"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const SLIDE_COUNT = 5;

type Slide = {
  headline: string;
  accent: string;
  afterAccent?: string;
  body: string;
  cta: { label: string; href: string };
  centerClass: string;
};

const SLIDES: Slide[] = [
  {
    headline: "Sprav svoju prvú objednávku",
    accent: "Akcia 10%",
    afterAccent: "pre prvý nákup",
    body: "Zaregistruj sa a získaj 10 % zľavu na celý prvý nákup. Stačí zadať kód pri pokladni — platí na všetky produkty v eshope.",
    cta: { label: "Objednať teraz", href: "/produkty" },
    centerClass: "bg-accent",
  },
  {
    headline: "Doprava zadarmo",
    accent: "Nad 50 €",
    body: "Nakúp za viac ako 50 € a dopravu máš od nás. Doručujeme cez Packetu na celé Slovensko, zvyčajne do 2–3 pracovných dní.",
    cta: { label: "Pozrieť produkty", href: "/produkty" },
    centerClass: "bg-brand",
  },
  {
    headline: "Novinky každý týždeň",
    accent: "Čerstvé modely",
    body: "Každý týždeň pridávame nové 3D výtlačky — praktické doplnky, hračky aj dekorácie. Sleduj novinky a nestratíš nič zaujímavé.",
    cta: { label: "Prejsť na novinky", href: "/produkty" },
    centerClass: "bg-emerald-500",
  },
  {
    headline: "Tlač na mieru",
    accent: "Vlastný dizajn",
    body: "Máš nápad alebo 3D model? Vytlačíme čokoľvek podľa tvojich predstáv. Pošli nám súbor alebo popiš čo chceš — zvyšok zvládneme my.",
    cta: { label: "Zistiť viac", href: "/tlac-na-mieru" },
    centerClass: "bg-violet-500",
  },
  {
    headline: "Sezónna ponuka",
    accent: "Do −20 %",
    body: "Vybrané produkty so zľavou až 20 %. Akcia platí do vypredania zásob — pozri čo je v ponuke a ušetri na svojom obľúbenom výtlačku.",
    cta: { label: "Nakupovať", href: "/produkty" },
    centerClass: "bg-rose-500",
  },
];

const AUTO_MS = 10_000;
const SLIDE_PERCENT = 100 / SLIDE_COUNT;

export function HomeHeroCarousel({ imageIds = [] }: { imageIds?: string[] }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % SLIDE_COUNT);
    }, AUTO_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section
      className="relative overflow-hidden rounded-2xl shadow-sm"
      aria-roledescription="carousel"
      aria-label="Úvodné bannery"
    >
      {/* Sliding track */}
      <div
        className="flex transition-transform duration-700 ease-out motion-reduce:duration-0 motion-reduce:transition-none"
        style={{
          width: `${SLIDE_COUNT * 100}%`,
          transform: `translateX(-${active * SLIDE_PERCENT}%)`,
        }}
      >
        {SLIDES.map((slide, i) => (
          <div
            key={i}
            className="grid shrink-0 md:grid-cols-[2fr_3fr]"
            style={{ width: `${SLIDE_PERCENT}%` }}
            aria-hidden={i !== active}
            inert={i !== active}
          >
            {/* Left — dark text panel */}
            <div className="flex min-h-[380px] flex-col justify-center gap-4 bg-neutral-900 p-7 text-white md:min-h-[500px] md:p-10">
              <h1
                id={`hero-slide-${i}`}
                className="text-2xl font-bold leading-tight md:text-3xl"
              >
                {slide.headline}{" "}
                <span className="text-accent">{slide.accent}</span>
                {slide.afterAccent ? <> {slide.afterAccent}</> : null}
              </h1>
              <p className="text-sm leading-relaxed text-neutral-300">
                {slide.body}
              </p>
              <div>
                <Link
                  href={slide.cta.href}
                  tabIndex={i === active ? 0 : -1}
                  className="inline-flex items-center rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
                >
                  {slide.cta.label}
                </Link>
              </div>
            </div>

            {/* Right — light product image panel */}
            <div className="relative min-h-[380px] overflow-hidden bg-neutral-100 md:min-h-[500px]">
              {imageIds.length > 0 ? (
                <img
                  src={`/api/images/${imageIds[i % imageIds.length]}`}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  loading={i === 0 ? "eager" : "lazy"}
                />
              ) : (
                <div className={`absolute inset-0 ${slide.centerClass} opacity-20`} />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Dots — overlaid on the light right half */}
      <div className="absolute bottom-3 left-[40%] right-0 flex justify-center gap-1.5">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`Banner ${i + 1} z ${SLIDE_COUNT}`}
            aria-current={i === active ? "true" : undefined}
            className={`h-1.5 w-6 rounded-full transition ${
              i === active
                ? "bg-neutral-600"
                : "bg-neutral-300 hover:bg-neutral-500"
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
