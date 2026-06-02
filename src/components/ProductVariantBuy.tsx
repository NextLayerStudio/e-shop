"use client";

import { useState } from "react";
import { addToCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { PRODUCT_VARIANTS, type VariantId } from "@/lib/productVariants";

/**
 * Výber variantu (figúrka / kľúčenka) s cenou + množstvo + pridanie do košíka.
 * Zobrazené na detaile produktu pod „Skladom".
 */
export function ProductVariantBuy({
  productId,
  figurkaPriceCents,
  klucenkaPriceCents,
  disabled,
}: {
  productId: string;
  figurkaPriceCents: number | null;
  klucenkaPriceCents: number | null;
  disabled?: boolean;
}) {
  const priceByVariant: Record<VariantId, number | null> = {
    FIGURKA: figurkaPriceCents,
    KLUCENKA: klucenkaPriceCents,
  };

  // Predvolene vyber prvý variant, ktorý má cenu.
  const firstAvailable =
    PRODUCT_VARIANTS.find((v) => typeof priceByVariant[v.id] === "number")?.id ??
    "FIGURKA";

  const [selected, setSelected] = useState<VariantId>(firstAvailable);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const selectedPrice = priceByVariant[selected];

  function handleAdd() {
    addToCart(productId, qty, selected);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-sm font-semibold text-neutral-700">
          Vyber prevedenie
        </p>
        <div className="grid grid-cols-2 gap-2">
          {PRODUCT_VARIANTS.map((v) => {
            const price = priceByVariant[v.id];
            const active = selected === v.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelected(v.id)}
                className={`flex flex-col items-start gap-0.5 rounded-xl border px-4 py-3 text-left transition ${
                  active
                    ? "border-brand bg-brand/5 ring-2 ring-brand/30"
                    : "border-neutral-200 hover:border-brand/40"
                }`}
              >
                <span className="text-sm font-semibold text-neutral-900">
                  {v.label}
                </span>
                <span className="text-base font-bold text-brand">
                  {typeof price === "number" ? formatPrice(price) : "—"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <div className="flex items-center justify-center rounded-2xl bg-brand px-6 py-3 text-center shadow-inner ring-2 ring-brand/20 sm:min-w-[140px]">
          <span className="text-2xl font-bold text-white tabular-nums">
            {typeof selectedPrice === "number" ? formatPrice(selectedPrice) : "—"}
          </span>
        </div>

        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
          <div className="inline-flex items-center rounded-full bg-white ring-1 ring-neutral-200">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={disabled}
              className="h-10 w-10 text-lg text-neutral-600 disabled:opacity-40"
              aria-label="Znížiť množstvo"
            >
              −
            </button>
            <span className="w-8 text-center text-sm font-semibold">{qty}</span>
            <button
              type="button"
              onClick={() => setQty((q) => q + 1)}
              disabled={disabled}
              className="h-10 w-10 text-lg text-neutral-600 disabled:opacity-40"
              aria-label="Zvýšiť množstvo"
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            disabled={disabled}
            className="min-h-[44px] min-w-[180px] flex-1 rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {added ? "Pridané do košíka ✓" : "Pridať do košíka"}
          </button>
        </div>
      </div>
    </div>
  );
}
