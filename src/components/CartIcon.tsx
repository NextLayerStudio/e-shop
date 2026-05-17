"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCart, removeStaleCartItems, totalQuantity } from "@/lib/cart";

export function CartIcon() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const refreshCount = () => setCount(totalQuantity());

    const items = getCart();
    if (items.length === 0) {
      refreshCount();
    } else {
      const ids = items.map((i) => i.productId).join(",");
      fetch(`/api/products/by-ids?ids=${ids}`)
        .then((r) => {
          if (!r.ok) throw new Error("fetch failed");
          return r.json();
        })
        .then((data: { products: { id: string }[] }) => {
          removeStaleCartItems(data.products.map((p) => p.id));
          refreshCount();
        })
        .catch(refreshCount);
    }

    const handler = () => refreshCount();
    window.addEventListener("iknow3d:cart-changed", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("iknow3d:cart-changed", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  return (
    <Link
      href="/kosik"
      aria-label="Košík"
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-neutral-700 shadow-sm hover:bg-neutral-50"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <circle cx="9" cy="20" r="1.5" />
        <circle cx="18" cy="20" r="1.5" />
        <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 7H6" />
      </svg>
      {count > 0 && (
        <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
