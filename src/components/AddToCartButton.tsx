"use client";

import { useState } from "react";
import { addToCart } from "@/lib/cart";

export function AddToCartButton({
  productId,
  disabled,
  className = "",
}: {
  productId: string;
  disabled?: boolean;
  className?: string;
}) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  return (
    <div className={`flex min-w-0 flex-1 flex-wrap items-center gap-3 ${className}`}>
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
        onClick={() => {
          addToCart(productId, qty);
          setAdded(true);
          window.setTimeout(() => setAdded(false), 1500);
        }}
        disabled={disabled}
        className="min-h-[44px] min-w-[180px] flex-1 rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {added ? "Pridané do košíka ✓" : "Pridať do košíka"}
      </button>
    </div>
  );
}
