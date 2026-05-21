"use client";

import { useState } from "react";
import { addToCart } from "@/lib/cart";

export function ProductCardAddToCartButton({ productId }: { productId: string }) {
  const [added, setAdded] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        addToCart(productId, 1);
        setAdded(true);
        window.setTimeout(() => setAdded(false), 1500);
      }}
      className="rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:brightness-95"
    >
      {added ? "Pridané ✓" : "Do košíka"}
    </button>
  );
}
