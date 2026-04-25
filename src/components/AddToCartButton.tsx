"use client";

import { useState } from "react";
import { addToCart } from "@/lib/cart";

export function AddToCartButton({
  productId,
  disabled,
}: {
  productId: string;
  disabled?: boolean;
}) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  return (
    <div className="mt-2 flex items-center gap-3">
      <div className="inline-flex items-center rounded-full ring-1 ring-neutral-200 bg-white">
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
        onClick={() => {
          addToCart(productId, qty);
          setAdded(true);
          window.setTimeout(() => setAdded(false), 1500);
        }}
        disabled={disabled}
        className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
      >
        {added ? "Pridané do košíka ✓" : "Pridať do košíka"}
      </button>
    </div>
  );
}
