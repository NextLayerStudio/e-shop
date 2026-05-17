"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getCart, removeStaleCartItems } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import {
  SHIPPING_METHODS,
  getShippingMethodById,
} from "@/lib/shippingMethods";
import {
  getShippingMethodId,
  setShippingMethodId,
} from "@/lib/shippingSelection";

export function ShippingDopravaForm() {
  const router = useRouter();
  const [cartEmpty, setCartEmpty] = useState<boolean | null>(null);
  const [methodId, setMethodId] = useState("");

  const syncFromStorage = useCallback(() => {
    const id = getShippingMethodId();
    if (id && getShippingMethodById(id)) {
      setMethodId(id);
    } else {
      setMethodId("");
    }
  }, []);

  useEffect(() => {
    const items = getCart();
    if (items.length === 0) {
      setCartEmpty(true);
      syncFromStorage();
      return;
    }
    const ids = items.map((i) => i.productId);
    fetch(`/api/products/by-ids?ids=${ids.join(",")}`)
      .then((r) => {
        if (!r.ok) throw new Error("products fetch failed");
        return r.json();
      })
      .then((data: { products: { id: string }[] }) => {
        removeStaleCartItems(data.products.map((p) => p.id));
        setCartEmpty(getCart().length === 0);
        syncFromStorage();
      })
      .catch(() => {
        setCartEmpty(false);
        syncFromStorage();
      });
  }, [syncFromStorage]);

  const selected = useMemo(
    () => (methodId ? getShippingMethodById(methodId) : undefined),
    [methodId]
  );

  function continueToCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (!methodId || !selected) return;
    setShippingMethodId(methodId);
    router.push("/pokladna");
  }

  if (cartEmpty === null) {
    return (
      <p className="mt-6 text-sm text-neutral-500">Načítavam košík…</p>
    );
  }

  if (cartEmpty) {
    return (
      <div className="mt-6 rounded-2xl border-2 border-dashed border-neutral-200 bg-white p-10 text-center">
        <p className="text-neutral-600">Tvoj košík je prázdny.</p>
        <Link
          href="/produkty"
          className="mt-4 inline-block rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Pozrieť produkty
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={continueToCheckout} className="mt-6 space-y-6">
      <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
        <strong className="font-semibold">Packeta</strong> — integrácia bude
        doplnená, keď bude k dispozícii účet. Medzitým sú tu orientačné ceny a
        výber metódy.
      </div>

      <fieldset className="space-y-3">
        <legend className="text-base font-semibold text-neutral-900">
          Spôsob dopravy
        </legend>
        {SHIPPING_METHODS.map((m) => (
          <label
            key={m.id}
            className={`flex cursor-pointer gap-3 rounded-2xl bg-white p-4 ring-1 transition hover:ring-brand/30 ${
              methodId === m.id ? "ring-2 ring-brand" : "ring-neutral-200"
            }`}
          >
            <input
              type="radio"
              name="shipping"
              value={m.id}
              checked={methodId === m.id}
              onChange={() => setMethodId(m.id)}
              className="mt-1"
            />
            <span className="min-w-0 flex-1">
              <span className="block font-medium text-neutral-900">
                {m.label}
              </span>
              <span className="mt-0.5 block text-sm text-neutral-500">
                {m.description}
              </span>
            </span>
            <span className="flex-shrink-0 font-semibold text-neutral-900">
              {m.feeCents === 0 ? "Zdarma" : formatPrice(m.feeCents)}
            </span>
          </label>
        ))}
      </fieldset>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/kosik"
          className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold text-neutral-700 ring-1 ring-neutral-200 hover:bg-neutral-50"
        >
          ← Späť do košíka
        </Link>
        <button
          type="submit"
          disabled={!methodId}
          className="inline-flex flex-1 items-center justify-center rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
        >
          Pokračovať k pokladni
        </button>
      </div>
    </form>
  );
}
