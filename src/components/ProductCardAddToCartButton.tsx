"use client";

import { useState } from "react";
import { addToCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { PRODUCT_VARIANTS, type VariantId } from "@/lib/productVariants";

type Props = {
  productId: string;
  productName?: string;
  hasVariants?: boolean;
  figurkaPriceCents?: number | null;
  klucenkaPriceCents?: number | null;
};

export function ProductCardAddToCartButton({
  productId,
  productName,
  hasVariants = false,
  figurkaPriceCents = null,
  klucenkaPriceCents = null,
}: Props) {
  const [added, setAdded] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  function flashAdded() {
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  }

  function handleClick() {
    if (hasVariants) {
      setPickerOpen(true);
      return;
    }
    addToCart(productId, 1);
    flashAdded();
  }

  function handlePick(variant: VariantId) {
    addToCart(productId, 1, variant);
    setPickerOpen(false);
    flashAdded();
  }

  const priceByVariant: Record<VariantId, number | null> = {
    FIGURKA: figurkaPriceCents,
    KLUCENKA: klucenkaPriceCents,
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:brightness-95"
      >
        {added ? "Pridané ✓" : "Do košíka"}
      </button>

      {pickerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-neutral-900/50 p-3 backdrop-blur-sm md:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Vyber prevedenie"
          onClick={() => setPickerOpen(false)}
        >
          <div
            className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1.5 bg-gradient-to-r from-brand via-brand to-accent" />
            <div className="px-5 py-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-brand">
                    Vyber prevedenie
                  </p>
                  {productName && (
                    <h3 className="mt-1 text-base font-semibold text-neutral-900">
                      {productName}
                    </h3>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setPickerOpen(false)}
                  className="-mr-1 -mt-1 rounded-full p-1 text-neutral-400 hover:text-neutral-700"
                  aria-label="Zavrieť"
                >
                  ×
                </button>
              </div>

              <div className="mt-4 grid gap-2">
                {PRODUCT_VARIANTS.map((v) => {
                  const price = priceByVariant[v.id];
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => handlePick(v.id)}
                      className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 px-4 py-3 text-left transition hover:border-brand hover:bg-brand/5"
                    >
                      <span className="font-semibold text-neutral-900">
                        {v.label}
                      </span>
                      <span className="font-bold text-brand">
                        {typeof price === "number" ? formatPrice(price) : "—"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
