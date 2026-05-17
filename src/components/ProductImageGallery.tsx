"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useState } from "react";

type GalleryImage = { id: string; alt: string | null };

type Props = {
  images: GalleryImage[];
  productName: string;
};

function ChevronLeft({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className={className}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className={className}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className={className}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export function ProductImageGallery({ images, productName }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const titleId = useId();

  const count = images.length;
  const primary = images[0];

  const openAt = useCallback((index: number) => {
    if (count === 0) return;
    const i = ((index % count) + count) % count;
    setLightboxIndex(i);
    setLightboxOpen(true);
  }, [count]);

  const goPrev = useCallback(() => {
    setLightboxIndex((i) => (i - 1 + count) % count);
  }, [count]);

  const goNext = useCallback(() => {
    setLightboxIndex((i) => (i + 1) % count);
  }, [count]);

  const closeLightbox = useCallback(() => {
    setActiveIndex(lightboxIndex);
    setLightboxOpen(false);
  }, [lightboxIndex]);

  useEffect(() => {
    if (!lightboxOpen) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    }

    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [lightboxOpen, goPrev, goNext, closeLightbox]);

  const mainPrev = useCallback(() => {
    setActiveIndex((i) => (i - 1 + count) % count);
  }, [count]);

  const mainNext = useCallback(() => {
    setActiveIndex((i) => (i + 1) % count);
  }, [count]);

  if (!primary) {
    return (
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200">
        <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-neutral-400">
          Žiadny obrázok
        </div>
      </div>
    );
  }

  const current = images[activeIndex] ?? primary;
  const lightboxImage = images[lightboxIndex] ?? primary;
  const altFor = (img: GalleryImage) => img.alt?.trim() || productName;

  return (
    <div>
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200">
        <Image
          src={`/api/images/${current.id}`}
          alt={altFor(current)}
          fill
          sizes="(min-width: 1024px) 40vw, 100vw"
          className="object-cover"
          priority
          unoptimized
        />
        <button
          type="button"
          onClick={() => openAt(activeIndex)}
          className="absolute inset-0 z-[1] cursor-zoom-in bg-transparent text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"
          aria-label={`Zväčšiť fotku: ${productName}`}
        />

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                mainPrev();
              }}
              className="absolute left-2 top-1/2 z-[2] flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-neutral-800 shadow-md ring-1 ring-neutral-200/80 transition hover:bg-white md:left-3 md:h-12 md:w-12"
              aria-label="Predchádzajúca fotka"
            >
              <ChevronLeft className="h-6 w-6 md:h-7 md:w-7" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                mainNext();
              }}
              className="absolute right-2 top-1/2 z-[2] flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-neutral-800 shadow-md ring-1 ring-neutral-200/80 transition hover:bg-white md:right-3 md:h-12 md:w-12"
              aria-label="Ďalšia fotka"
            >
              <ChevronRight className="h-6 w-6 md:h-7 md:w-7" />
            </button>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`relative h-20 w-20 flex-shrink-0 snap-start overflow-hidden rounded-xl bg-white ring-2 ring-offset-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand md:h-24 md:w-24 ${
                i === activeIndex ? "ring-brand" : "ring-neutral-200 hover:ring-neutral-300"
              }`}
              aria-label={`Zobraziť fotku ${i + 1} z ${count} v náhľade`}
              aria-pressed={i === activeIndex}
            >
              <Image
                src={`/api/images/${img.id}`}
                alt=""
                fill
                sizes="96px"
                className="object-cover"
                unoptimized
              />
            </button>
          ))}
        </div>
      )}

      {lightboxOpen && count > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <p id={titleId} className="sr-only">
            Galéria produktu {productName}, snímka {lightboxIndex + 1} z {count}
          </p>

          <button
            type="button"
            className="absolute inset-0 bg-black/85"
            aria-label="Zavrieť galériu"
            onClick={closeLightbox}
          />

          <button
            type="button"
            className="absolute right-3 top-3 z-20 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            onClick={closeLightbox}
            aria-label="Zavrieť"
          >
            <CloseIcon className="h-6 w-6" />
          </button>

          {count > 1 && (
            <>
              <button
                type="button"
                className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/15 p-3 text-white shadow-lg backdrop-blur transition hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white md:left-6"
                onClick={goPrev}
                aria-label="Predchádzajúca fotka"
              >
                <ChevronLeft className="h-7 w-7 md:h-8 md:w-8" />
              </button>
              <button
                type="button"
                className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/15 p-3 text-white shadow-lg backdrop-blur transition hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white md:right-6"
                onClick={goNext}
                aria-label="Ďalšia fotka"
              >
                <ChevronRight className="h-7 w-7 md:h-8 md:w-8" />
              </button>
            </>
          )}

          <div className="relative z-10 max-h-[85vh] w-full max-w-5xl">
            <div className="relative aspect-square w-full md:aspect-[4/3] md:max-h-[80vh]">
              <Image
                src={`/api/images/${lightboxImage.id}`}
                alt={altFor(lightboxImage)}
                fill
                sizes="100vw"
                className="object-contain"
                priority
                unoptimized
              />
            </div>
            {count > 1 && (
              <p className="pointer-events-none mt-4 text-center text-sm text-white/90">
                {lightboxIndex + 1} / {count}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
