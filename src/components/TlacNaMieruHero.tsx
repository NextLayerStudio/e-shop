"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const CAROUSEL_DOTS = 4;

/**
 * Promo hero aligned with „Tlač na mieru“ mockup: dark banner, spotlight copy, image + pagination dots.
 */
export function TlacNaMieruHero() {
  const [activeDot, setActiveDot] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setActiveDot((i) => (i + 1) % CAROUSEL_DOTS);
    }, 6_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section className="overflow-hidden rounded-[2rem] bg-neutral-800 px-6 py-10 shadow-lg ring-1 ring-black/10 md:px-10 md:py-12 lg:rounded-[2.25rem]">
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-14">
        <div className="text-center lg:text-left">
          <p className="text-sm font-medium tracking-wide text-white/75">
            Hit týždňa
          </p>
          <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight text-accent md:text-4xl lg:text-[2.65rem] lg:leading-tight">
            najpopulárnejší výtlačok od zákazníka
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-pretty leading-relaxed text-white/85 lg:mx-0">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse
            vel quam blandit, interdum nisi nec, porta libero. Cras fermentum eu
            nunc sit amet dapibus. Integer id laoreet neque — viac sa dozvieš vo
            formulári nižšie.
          </p>
          <Link
            href="#tlac-form"
            className="mt-8 inline-flex rounded-full bg-brand px-7 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-brand-dark"
          >
            Pozrieť viac
          </Link>
        </div>

        <div className="relative mx-auto aspect-[5/4] w-full max-w-xl overflow-hidden rounded-3xl bg-neutral-900 ring-2 ring-white/10 lg:aspect-[16/13] lg:max-w-none">
          <Image
            src="/images/tlac-na-mieru-mockup.png"
            alt="Ukážka 3D výtlačku na zákazku"
            fill
            className="object-cover object-center"
            sizes="(min-width: 1024px) 50vw, 100vw"
            priority
          />
          <div
            className="absolute inset-x-0 bottom-4 flex justify-center gap-2"
            role="presentation"
          >
            {Array.from({ length: CAROUSEL_DOTS }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveDot(i)}
                aria-label={`Snímka ${i + 1}`}
                className={`h-2.5 w-2.5 rounded-full transition ${
                  i === activeDot
                    ? "scale-110 bg-brand shadow-sm shadow-brand/60"
                    : "bg-white/50 hover:bg-white/80"
                }`}
                aria-current={i === activeDot ? true : undefined}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
