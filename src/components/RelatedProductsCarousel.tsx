"use client";

import { useCallback, useRef } from "react";
import type { ProductCardData } from "./ProductCard";
import { ProductCard } from "./ProductCard";

function CarouselChevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="h-5 w-5"
      aria-hidden
    >
      {dir === "left" ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      )}
    </svg>
  );
}

export function RelatedProductsCarousel({ products }: { products: ProductCardData[] }) {
  const ref = useRef<HTMLDivElement>(null);

  const scrollByCards = useCallback((direction: -1 | 1) => {
    const el = ref.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-carousel-card]");
    const w = card?.offsetWidth ?? 280;
    const gap = 16;
    el.scrollBy({ left: direction * (w + gap) * 2, behavior: "smooth" });
  }, []);

  if (products.length === 0) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => scrollByCards(-1)}
        className="absolute left-0 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-neutral-700 shadow-md ring-1 ring-neutral-200 transition hover:bg-neutral-50 md:-left-4"
        aria-label="Posunúť doľava"
      >
        <CarouselChevron dir="left" />
      </button>
      <button
        type="button"
        onClick={() => scrollByCards(1)}
        className="absolute right-0 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-neutral-700 shadow-md ring-1 ring-neutral-200 transition hover:bg-neutral-50 md:-right-4"
        aria-label="Posunúť doprava"
      >
        <CarouselChevron dir="right" />
      </button>

      <div
        ref={ref}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-2 py-1 [-ms-overflow-style:none] [scrollbar-width:none] md:px-12 [&::-webkit-scrollbar]:hidden"
      >
        {products.map((p) => (
          <div
            key={p.id}
            data-carousel-card
            className="w-[min(100vw-3rem,260px)] flex-shrink-0 snap-start sm:w-[240px]"
          >
            <ProductCard product={p} ctaLabel="Pozrieť model" />
          </div>
        ))}
      </div>
    </div>
  );
}
